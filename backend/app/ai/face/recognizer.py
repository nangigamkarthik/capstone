"""
Face Recognition Module — InsightFace/ArcFace

Detects faces within person crops and generates 512-d ArcFace embeddings
for identity verification. Supports enrollment (storing embeddings) and
real-time matching against a gallery database.

Pipeline: Person crop → Face detection → Alignment → ArcFace embedding → Gallery match
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict
from loguru import logger

try:
    import insightface
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    logger.warning("insightface not installed. Face module will use mock mode.")


@dataclass
class FaceResult:
    """Result of face detection and recognition on a single face."""
    bbox: Tuple[float, float, float, float]  # (x1, y1, x2, y2) within the crop
    embedding: Optional[np.ndarray] = None   # 512-d ArcFace embedding
    confidence: float = 0.0
    identity_id: Optional[int] = None        # Matched student/teacher ID
    identity_name: Optional[str] = None
    match_score: float = 0.0                 # Cosine similarity to matched identity
    age: Optional[int] = None
    gender: Optional[str] = None


class FaceRecognizer:
    """
    InsightFace-based face detector and recognizer.

    Uses the buffalo_l model for detection + alignment + ArcFace recognition.
    Falls back to mock embeddings when insightface is not installed.

    Args:
        model_name: InsightFace model pack ('buffalo_l', 'buffalo_s', 'antelopev2')
        detection_size: Input resolution for face detection
        match_threshold: Cosine similarity threshold for identity match
    """

    def __init__(
        self,
        model_name: str = "buffalo_l",
        detection_size: Tuple[int, int] = (640, 640),
        match_threshold: float = 0.45,
    ):
        self.model_name = model_name
        self.detection_size = detection_size
        self.match_threshold = match_threshold
        self.model: Optional[object] = None

        # Gallery: maps identity_id → (name, embedding)
        self._gallery: Dict[int, Tuple[str, np.ndarray]] = {}

        self._load_model()

    def _load_model(self):
        if not INSIGHTFACE_AVAILABLE:
            logger.warning("Running face module in MOCK mode.")
            return

        try:
            self.model = FaceAnalysis(
                name=self.model_name,
                providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            )
            self.model.prepare(ctx_id=0, det_size=self.detection_size)
            logger.info(f"Loaded InsightFace model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load InsightFace: {e}")
            self.model = None

    def detect_and_embed(self, frame: np.ndarray) -> List[FaceResult]:
        """
        Detect all faces in a frame and compute ArcFace embeddings.

        Args:
            frame: BGR image (H, W, 3)

        Returns:
            List of FaceResult with bounding boxes and embeddings
        """
        if self.model is None:
            return self._mock_detect(frame)

        faces = self.model.get(frame)
        results: List[FaceResult] = []

        for face in faces:
            bbox = tuple(face.bbox.astype(float))
            embedding = face.normed_embedding if hasattr(face, "normed_embedding") else None

            result = FaceResult(
                bbox=(bbox[0], bbox[1], bbox[2], bbox[3]),
                embedding=embedding,
                confidence=float(face.det_score) if hasattr(face, "det_score") else 0.0,
                age=int(face.age) if hasattr(face, "age") else None,
                gender="M" if hasattr(face, "gender") and face.gender == 1 else "F" if hasattr(face, "gender") else None,
            )

            # Match against gallery
            if embedding is not None:
                match_id, match_name, match_score = self._match_gallery(embedding)
                if match_score >= self.match_threshold:
                    result.identity_id = match_id
                    result.identity_name = match_name
                    result.match_score = match_score

            results.append(result)

        return results

    def enroll(self, identity_id: int, name: str, embedding: np.ndarray):
        """Add or update an identity in the gallery."""
        # Normalize embedding
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        self._gallery[identity_id] = (name, embedding)
        logger.info(f"Enrolled identity: {name} (id={identity_id})")

    def enroll_from_frame(self, identity_id: int, name: str, frame: np.ndarray) -> bool:
        """Detect the largest face in a frame and enroll it."""
        faces = self.detect_and_embed(frame)
        if not faces:
            logger.warning(f"No face found for enrollment of {name}")
            return False

        # Pick the largest face by area
        largest = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        if largest.embedding is None:
            logger.warning(f"No embedding computed for {name}")
            return False

        self.enroll(identity_id, name, largest.embedding)
        return True

    def _match_gallery(self, embedding: np.ndarray) -> Tuple[Optional[int], Optional[str], float]:
        """Find the best matching identity in the gallery via cosine similarity."""
        if not self._gallery:
            return None, None, 0.0

        best_id, best_name, best_score = None, None, -1.0

        for gid, (gname, gemb) in self._gallery.items():
            score = float(np.dot(embedding, gemb))
            if score > best_score:
                best_id, best_name, best_score = gid, gname, score

        return best_id, best_name, best_score

    def _mock_detect(self, frame: np.ndarray) -> List[FaceResult]:
        """Generate synthetic face results for testing."""
        h, w = frame.shape[:2]
        rng = np.random.RandomState(42)
        n = rng.randint(2, 6)
        results = []
        for i in range(n):
            cx, cy = rng.uniform(0.2, 0.8) * w, rng.uniform(0.2, 0.5) * h
            fw, fh = rng.uniform(30, 60), rng.uniform(40, 80)
            emb = rng.randn(512).astype(np.float32)
            emb /= np.linalg.norm(emb)
            results.append(FaceResult(
                bbox=(cx - fw/2, cy - fh/2, cx + fw/2, cy + fh/2),
                embedding=emb,
                confidence=rng.uniform(0.7, 0.99),
            ))
        return results

    @property
    def gallery_size(self) -> int:
        return len(self._gallery)

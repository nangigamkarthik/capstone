"""
Head Pose Estimation — 6DoF (Yaw, Pitch, Roll)

Computes head orientation angles from MediaPipe Face Mesh 468 landmarks
using the Perspective-n-Point (PnP) algorithm with a canonical 3D face model.

Used for attention analysis: looking at board, teacher, away, etc.
"""
import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple, List
from loguru import logger

try:
    import mediapipe as mp
    import cv2
    HEADPOSE_AVAILABLE = True
except ImportError:
    HEADPOSE_AVAILABLE = False
    logger.warning("mediapipe/cv2 not installed. Head pose module will use mock mode.")


# Canonical 3D face model points (subset of 468 landmarks)
# Indices: nose tip(1), chin(152), left eye outer(33), right eye outer(263),
#          left mouth corner(61), right mouth corner(291)
CANONICAL_3D_POINTS = np.array([
    [0.0, 0.0, 0.0],           # Nose tip
    [0.0, -330.0, -65.0],      # Chin
    [-225.0, 170.0, -135.0],   # Left eye outer
    [225.0, 170.0, -135.0],    # Right eye outer
    [-150.0, -150.0, -125.0],  # Left mouth corner
    [150.0, -150.0, -125.0],   # Right mouth corner
], dtype=np.float64)

FACE_MESH_INDICES = [1, 152, 33, 263, 61, 291]


@dataclass
class HeadPoseResult:
    """Head orientation in Euler angles."""
    yaw: float    # Left-right rotation (degrees)
    pitch: float  # Up-down rotation (degrees)
    roll: float   # Tilt rotation (degrees)
    confidence: float
    track_id: int = -1
    direction_vector: Optional[Tuple[float, float, float]] = None

    @property
    def is_looking_forward(self) -> bool:
        return abs(self.yaw) < 25 and abs(self.pitch) < 20

    @property
    def is_looking_away(self) -> bool:
        return abs(self.yaw) > 45 or abs(self.pitch) > 35

    @property
    def is_looking_down(self) -> bool:
        return self.pitch > 20

    def to_dict(self) -> dict:
        return {
            "yaw": round(self.yaw, 2),
            "pitch": round(self.pitch, 2),
            "roll": round(self.roll, 2),
            "confidence": round(self.confidence, 4),
            "looking_forward": self.is_looking_forward,
        }


class HeadPoseEstimator:
    """
    Estimates head pose (yaw, pitch, roll) from face landmarks using solvePnP.

    Uses MediaPipe Face Mesh to extract 468 facial landmarks, then solves
    the Perspective-n-Point problem against a canonical 3D face model
    to compute 6DoF head orientation.

    Args:
        min_detection_confidence: Face mesh detection threshold
        min_tracking_confidence: Face mesh tracking threshold
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self.face_mesh: Optional[object] = None
        self._config = {
            "static_image_mode": False,
            "max_num_faces": 1,
            "refine_landmarks": True,
            "min_detection_confidence": min_detection_confidence,
            "min_tracking_confidence": min_tracking_confidence,
        }
        self._load_model()

    def _load_model(self):
        if not HEADPOSE_AVAILABLE:
            return
        try:
            self.face_mesh = mp.solutions.face_mesh.FaceMesh(**self._config)
            logger.info("Loaded MediaPipe Face Mesh for head pose estimation")
        except Exception as e:
            logger.error(f"Failed to load Face Mesh: {e}")

    def estimate(self, face_crop: np.ndarray, track_id: int = -1) -> Optional[HeadPoseResult]:
        """
        Estimate head pose from a face crop.

        Args:
            face_crop: BGR face image (H, W, 3)
            track_id: Associated tracker ID

        Returns:
            HeadPoseResult with yaw/pitch/roll, or None if no face detected
        """
        if not HEADPOSE_AVAILABLE or self.face_mesh is None:
            return self._mock_estimate(track_id)

        h, w = face_crop.shape[:2]
        rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0]

        # Extract 2D image points for the 6 canonical landmarks
        image_points = np.array([
            [landmarks.landmark[idx].x * w, landmarks.landmark[idx].y * h]
            for idx in FACE_MESH_INDICES
        ], dtype=np.float64)

        # Camera matrix (approximate)
        focal_length = w
        cam_matrix = np.array([
            [focal_length, 0, w / 2],
            [0, focal_length, h / 2],
            [0, 0, 1],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        # Solve PnP
        success, rotation_vec, translation_vec = cv2.solvePnP(
            CANONICAL_3D_POINTS, image_points, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return None

        # Convert rotation vector to rotation matrix, then extract Euler angles
        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        proj_matrix = np.hstack((rotation_mat, translation_vec))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(
            np.vstack((proj_matrix, [0, 0, 0, 1]))[:3]
        )

        yaw = float(euler_angles[1, 0])
        pitch = float(euler_angles[0, 0])
        roll = float(euler_angles[2, 0])

        # Compute 3D direction vector
        nose_end = np.array([[0, 0, 500.0]], dtype=np.float64)
        nose_end_2d, _ = cv2.projectPoints(nose_end, rotation_vec, translation_vec, cam_matrix, dist_coeffs)
        direction = (float(nose_end_2d[0][0][0] - w/2), float(nose_end_2d[0][0][1] - h/2), 500.0)
        norm = np.linalg.norm(direction)
        direction = tuple(d / norm for d in direction) if norm > 0 else (0.0, 0.0, 1.0)

        # Confidence from landmark visibility
        vis_scores = [landmarks.landmark[idx].visibility for idx in FACE_MESH_INDICES
                      if hasattr(landmarks.landmark[idx], 'visibility')]
        confidence = float(np.mean(vis_scores)) if vis_scores else 0.5

        return HeadPoseResult(
            yaw=yaw, pitch=pitch, roll=roll,
            confidence=confidence, track_id=track_id,
            direction_vector=direction,
        )

    def _mock_estimate(self, track_id: int) -> HeadPoseResult:
        rng = np.random.RandomState(abs(track_id) if track_id >= 0 else 42)
        return HeadPoseResult(
            yaw=rng.uniform(-40, 40), pitch=rng.uniform(-20, 20), roll=rng.uniform(-10, 10),
            confidence=rng.uniform(0.6, 0.95), track_id=track_id,
            direction_vector=(rng.uniform(-0.5, 0.5), rng.uniform(-0.3, 0.3), 1.0),
        )

    def close(self):
        if self.face_mesh and hasattr(self.face_mesh, "close"):
            self.face_mesh.close()

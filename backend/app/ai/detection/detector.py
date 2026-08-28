"""
Student Detection Module — YOLO26 Person Detector

Uses Ultralytics YOLO26 for NMS-free, real-time person detection.
Supports configurable model sizes (nano/small/medium/large) for
speed vs accuracy tradeoffs.

Pipeline: Frame → YOLO26 → Person bounding boxes + confidence → Tracker input
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not installed. Detection module will use mock mode.")


@dataclass
class Detection:
    """Single person detection result."""
    bbox: Tuple[float, float, float, float]  # (x1, y1, x2, y2) absolute coords
    confidence: float
    class_id: int = 0  # 0 = person in COCO
    track_id: int = -1  # Assigned by tracker later
    center: Tuple[float, float] = field(init=False)

    def __post_init__(self):
        x1, y1, x2, y2 = self.bbox
        self.center = ((x1 + x2) / 2, (y1 + y2) / 2)

    @property
    def width(self) -> float:
        return self.bbox[2] - self.bbox[0]

    @property
    def height(self) -> float:
        return self.bbox[3] - self.bbox[1]

    @property
    def area(self) -> float:
        return self.width * self.height

    def to_xywh(self) -> Tuple[float, float, float, float]:
        """Convert to center-x, center-y, width, height format."""
        return (self.center[0], self.center[1], self.width, self.height)

    def to_dict(self) -> dict:
        return {
            "bbox": list(self.bbox),
            "confidence": round(self.confidence, 4),
            "track_id": self.track_id,
            "center": list(self.center),
        }


class PersonDetector:
    """
    YOLO26-based person detector with configurable model size.

    Model sizes:
        - 'n' (nano): ~1.5ms/frame, good for edge devices
        - 's' (small): ~2.5ms/frame, balanced
        - 'm' (medium): ~4.0ms/frame, higher accuracy
        - 'l' (large): ~6.5ms/frame, best accuracy

    Args:
        model_size: One of 'n', 's', 'm', 'l'
        confidence_threshold: Minimum detection confidence (0.0 - 1.0)
        device: 'cuda', 'cpu', or 'auto'
        person_only: If True, filters to person class only (class_id=0)
    """

    SUPPORTED_SIZES = ("n", "s", "m", "l")

    def __init__(
        self,
        model_size: str = "n",
        confidence_threshold: float = 0.45,
        device: str = "auto",
        person_only: bool = True,
    ):
        if model_size not in self.SUPPORTED_SIZES:
            raise ValueError(f"model_size must be one of {self.SUPPORTED_SIZES}, got '{model_size}'")

        self.model_size = model_size
        self.confidence_threshold = confidence_threshold
        self.person_only = person_only
        self.device = device
        self.model: Optional[object] = None
        self._frame_count = 0

        self._load_model()

    def _load_model(self):
        """Load the YOLO model weights."""
        if not YOLO_AVAILABLE:
            logger.warning("Running in MOCK mode — no real YOLO model loaded.")
            return

        model_name = f"yolo11{self.model_size}.pt"  # ultralytics auto-downloads
        try:
            self.model = YOLO(model_name)
            if self.device == "auto":
                import torch
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loaded {model_name} on device={self.device}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}. Falling back to mock mode.")
            self.model = None

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Run person detection on a single frame.

        Args:
            frame: BGR image as numpy array (H, W, 3)

        Returns:
            List of Detection objects for each person found
        """
        self._frame_count += 1

        if self.model is None:
            return self._mock_detect(frame)

        results = self.model(
            frame,
            conf=self.confidence_threshold,
            device=self.device,
            verbose=False,
        )

        detections: List[Detection] = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                conf = float(boxes.conf[i].item())

                # Filter to person class only
                if self.person_only and cls_id != 0:
                    continue

                x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy()
                detections.append(Detection(
                    bbox=(float(x1), float(y1), float(x2), float(y2)),
                    confidence=conf,
                    class_id=cls_id,
                ))

        logger.debug(f"Frame {self._frame_count}: detected {len(detections)} persons")
        return detections

    def _mock_detect(self, frame: np.ndarray) -> List[Detection]:
        """Generate synthetic detections with temporal consistency for tracker testing."""
        h, w = frame.shape[:2]
        n_persons = 6
        detections = []
        for i in range(n_persons):
            # Seed based on person index i so they stay in roughly the same position
            rng_person = np.random.RandomState(i * 100 + 42)
            base_cx = rng_person.uniform(0.15, 0.85) * w
            base_cy = rng_person.uniform(0.35, 0.75) * h
            
            # Seed based on frame count for small jitter
            rng_frame = np.random.RandomState(self._frame_count)
            jitter_x = rng_frame.uniform(-4, 4)
            jitter_y = rng_frame.uniform(-4, 4)
            
            cx = base_cx + jitter_x
            cy = base_cy + jitter_y
            
            bw = rng_person.uniform(50, 70)
            bh = rng_person.uniform(100, 150)
            conf = rng_frame.uniform(0.82, 0.96)

            detections.append(Detection(
                bbox=(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2),
                confidence=conf,
            ))

        return detections

    def warmup(self, imgsz: Tuple[int, int] = (640, 480)):
        """Warmup the model with a dummy frame for stable latency."""
        dummy = np.zeros((*imgsz, 3), dtype=np.uint8)
        self.detect(dummy)
        self._frame_count = 0
        logger.info("Detector warmup complete")

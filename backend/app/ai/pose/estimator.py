"""
Pose Estimation Module — MediaPipe 33-Keypoint Body Pose

Extracts full-body 33-keypoint skeletons from person crops using
Google MediaPipe Pose. Provides normalized and world coordinates
for downstream activity recognition and behavior analysis.

Keypoint indices follow MediaPipe BlazePose topology:
  0: nose, 11-12: shoulders, 13-14: elbows, 15-16: wrists,
  23-24: hips, 25-26: knees, 27-28: ankles, etc.
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict
from collections import deque
from loguru import logger

try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False
    logger.warning("mediapipe not installed. Pose module will use mock mode.")


@dataclass
class Keypoint:
    """A single pose keypoint."""
    x: float           # Normalized [0, 1] within crop
    y: float
    z: float           # Depth (relative)
    visibility: float  # Confidence [0, 1]
    world_x: float = 0.0  # World coords in meters
    world_y: float = 0.0
    world_z: float = 0.0


@dataclass
class PoseResult:
    """Full-body pose estimation result for one person."""
    keypoints: List[Keypoint]
    confidence: float = 0.0  # Average visibility
    track_id: int = -1

    def get_keypoint(self, idx: int) -> Keypoint:
        return self.keypoints[idx] if idx < len(self.keypoints) else Keypoint(0, 0, 0, 0)

    @property
    def nose(self) -> Keypoint: return self.get_keypoint(0)
    @property
    def left_shoulder(self) -> Keypoint: return self.get_keypoint(11)
    @property
    def right_shoulder(self) -> Keypoint: return self.get_keypoint(12)
    @property
    def left_wrist(self) -> Keypoint: return self.get_keypoint(15)
    @property
    def right_wrist(self) -> Keypoint: return self.get_keypoint(16)
    @property
    def left_hip(self) -> Keypoint: return self.get_keypoint(23)
    @property
    def right_hip(self) -> Keypoint: return self.get_keypoint(24)

    def to_array(self) -> np.ndarray:
        """Convert keypoints to (33, 4) array [x, y, z, visibility]."""
        return np.array([[kp.x, kp.y, kp.z, kp.visibility] for kp in self.keypoints])

    def to_dict(self) -> dict:
        return {
            "keypoints": [{"x": kp.x, "y": kp.y, "z": kp.z, "v": kp.visibility}
                          for kp in self.keypoints],
            "confidence": self.confidence,
        }


class PoseEstimator:
    """
    MediaPipe Pose full-body 33-keypoint estimator.

    Processes cropped person images and returns normalized keypoint
    coordinates with visibility scores.

    Args:
        static_image_mode: True for single images, False for video (temporal smoothing)
        model_complexity: 0 (lite), 1 (full), 2 (heavy)
        min_detection_confidence: Minimum confidence for pose detection
        min_tracking_confidence: Minimum confidence for tracking across frames
    """

    def __init__(
        self,
        static_image_mode: bool = False,
        model_complexity: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self.model: Optional[object] = None
        self._config = {
            "static_image_mode": static_image_mode,
            "model_complexity": model_complexity,
            "min_detection_confidence": min_detection_confidence,
            "min_tracking_confidence": min_tracking_confidence,
        }
        self._load_model()

    def _load_model(self):
        if not MP_AVAILABLE:
            logger.warning("Running pose module in MOCK mode.")
            return
        try:
            self.model = mp.solutions.pose.Pose(**self._config)
            logger.info(f"Loaded MediaPipe Pose (complexity={self._config['model_complexity']})")
        except Exception as e:
            logger.error(f"Failed to load MediaPipe Pose: {e}")
            self.model = None

    def estimate(self, person_crop: np.ndarray, track_id: int = -1) -> Optional[PoseResult]:
        """
        Estimate pose for a single person crop.

        Args:
            person_crop: BGR image of a cropped person (H, W, 3)
            track_id: Associated tracker ID

        Returns:
            PoseResult with 33 keypoints, or None if no pose detected
        """
        if self.model is None:
            return self._mock_estimate(person_crop, track_id)

        # MediaPipe expects RGB
        try:
            import cv2
            rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
        except ImportError:
            rgb = person_crop[:, :, ::-1]  # Simple BGR→RGB flip

        results = self.model.process(rgb)

        if results.pose_landmarks is None:
            return None

        keypoints: List[Keypoint] = []
        for lm in results.pose_landmarks.landmark:
            keypoints.append(Keypoint(x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility))

        # Add world coordinates if available
        if results.pose_world_landmarks:
            for i, wlm in enumerate(results.pose_world_landmarks.landmark):
                if i < len(keypoints):
                    keypoints[i].world_x = wlm.x
                    keypoints[i].world_y = wlm.y
                    keypoints[i].world_z = wlm.z

        avg_vis = np.mean([kp.visibility for kp in keypoints])

        return PoseResult(keypoints=keypoints, confidence=float(avg_vis), track_id=track_id)

    def _mock_estimate(self, crop: np.ndarray, track_id: int) -> PoseResult:
        """Generate synthetic 33-keypoint pose for testing."""
        rng = np.random.RandomState(track_id if track_id >= 0 else 42)
        keypoints = []
        for i in range(33):
            keypoints.append(Keypoint(
                x=rng.uniform(0.2, 0.8), y=rng.uniform(0.1, 0.9),
                z=rng.uniform(-0.5, 0.5), visibility=rng.uniform(0.5, 1.0),
            ))
        return PoseResult(keypoints=keypoints, confidence=rng.uniform(0.6, 0.95), track_id=track_id)

    def close(self):
        if self.model is not None and hasattr(self.model, "close"):
            self.model.close()


class PoseHistory:
    """
    Temporal pose history tracker with smoothing.

    Stores a rolling window of PoseResults per track_id and provides
    temporally smoothed keypoint positions via exponential moving average.
    """

    def __init__(self, window_size: int = 30, alpha: float = 0.3):
        self.window_size = window_size
        self.alpha = alpha  # EMA smoothing factor
        self._history: Dict[int, deque] = {}

    def update(self, pose: PoseResult):
        """Add a new pose observation for a tracked person."""
        tid = pose.track_id
        if tid not in self._history:
            self._history[tid] = deque(maxlen=self.window_size)
        self._history[tid].append(pose)

    def get_smoothed(self, track_id: int) -> Optional[PoseResult]:
        """Get EMA-smoothed pose for a track_id."""
        if track_id not in self._history or not self._history[track_id]:
            return None

        history = self._history[track_id]
        latest = history[-1]

        if len(history) < 2:
            return latest

        # EMA over keypoint positions
        smoothed_kps: List[Keypoint] = []
        for kp_idx in range(len(latest.keypoints)):
            sx, sy, sz = 0.0, 0.0, 0.0
            weight = 1.0
            total_weight = 0.0

            for pose in reversed(history):
                kp = pose.keypoints[kp_idx] if kp_idx < len(pose.keypoints) else latest.keypoints[kp_idx]
                sx += weight * kp.x
                sy += weight * kp.y
                sz += weight * kp.z
                total_weight += weight
                weight *= (1 - self.alpha)

            smoothed_kps.append(Keypoint(
                x=sx / total_weight, y=sy / total_weight, z=sz / total_weight,
                visibility=latest.keypoints[kp_idx].visibility,
            ))

        return PoseResult(keypoints=smoothed_kps, confidence=latest.confidence, track_id=track_id)

    def get_velocity(self, track_id: int) -> Optional[np.ndarray]:
        """Compute per-keypoint velocity from last two frames."""
        if track_id not in self._history or len(self._history[track_id]) < 2:
            return None
        prev = self._history[track_id][-2].to_array()[:, :3]
        curr = self._history[track_id][-1].to_array()[:, :3]
        return curr - prev

    def cleanup(self, active_ids: set):
        """Remove history for tracks no longer active."""
        stale = [tid for tid in self._history if tid not in active_ids]
        for tid in stale:
            del self._history[tid]

"""
Gaze Tracking — Direction Estimation & Target Classification

Combines eye landmark analysis with head pose to estimate gaze direction,
then classifies the gaze target (teacher, board, laptop, phone, away,
other_student) using room geometry and gaze vector intersection.
"""
import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple, Dict, List
from loguru import logger

from app.ai.head_pose.estimator import HeadPoseResult


@dataclass
class GazeTarget:
    """Defines a spatial zone in the classroom that can be a gaze target."""
    name: str                          # e.g., 'board', 'teacher', 'laptop'
    region_2d: Tuple[float, float, float, float]  # (x1, y1, x2, y2) normalized [0, 1]
    position_3d: Optional[Tuple[float, float, float]] = None
    priority: int = 0                  # Higher = checked first


@dataclass
class GazeResult:
    """Gaze estimation result for one person."""
    gaze_vector: Tuple[float, float, float]  # Normalized 3D gaze direction
    gaze_target: str           # Classified target name
    confidence: float
    track_id: int = -1
    yaw: float = 0.0          # Gaze yaw relative to camera
    pitch: float = 0.0        # Gaze pitch relative to camera

    def to_dict(self) -> dict:
        return {
            "gaze_vector": [round(v, 4) for v in self.gaze_vector],
            "target": self.gaze_target,
            "confidence": round(self.confidence, 4),
            "yaw": round(self.yaw, 2),
            "pitch": round(self.pitch, 2),
        }


class GazeEstimator:
    """
    Gaze direction estimator and target classifier.

    Combines head orientation (from HeadPoseEstimator) with eye landmark
    offsets to produce a refined gaze direction vector. Then classifies
    the gaze target using predefined room geometry zones.

    Args:
        eye_weight: Blend factor for eye-based gaze vs head-only (0-1)
    """

    def __init__(self, eye_weight: float = 0.3):
        self.eye_weight = eye_weight
        self.targets: List[GazeTarget] = []
        self._setup_default_targets()

    def _setup_default_targets(self):
        """Setup default classroom gaze targets based on typical room layout."""
        self.targets = [
            GazeTarget(name="board", region_2d=(0.2, 0.0, 0.8, 0.3), priority=2),
            GazeTarget(name="teacher", region_2d=(0.3, 0.2, 0.7, 0.5), priority=3),
            GazeTarget(name="laptop", region_2d=(0.3, 0.6, 0.7, 0.9), priority=1),
            GazeTarget(name="phone", region_2d=(0.4, 0.7, 0.6, 1.0), priority=1),
        ]

    def configure_targets(self, targets_config: List[dict]):
        """
        Configure gaze targets from room layout JSON.

        Expected format:
        [{"name": "board", "x1": 0.2, "y1": 0.0, "x2": 0.8, "y2": 0.3, "priority": 2}, ...]
        """
        self.targets = [
            GazeTarget(
                name=t["name"],
                region_2d=(t["x1"], t["y1"], t["x2"], t["y2"]),
                priority=t.get("priority", 0),
            )
            for t in targets_config
        ]
        logger.info(f"Configured {len(self.targets)} gaze targets")

    def estimate(
        self,
        head_pose: HeadPoseResult,
        eye_landmarks: Optional[np.ndarray] = None,
    ) -> GazeResult:
        """
        Estimate gaze direction from head pose and optional eye landmarks.

        Args:
            head_pose: HeadPoseResult from HeadPoseEstimator
            eye_landmarks: Optional (6, 2) array of left/right eye contour points

        Returns:
            GazeResult with classified target
        """
        # Base gaze from head direction
        yaw_rad = np.radians(head_pose.yaw)
        pitch_rad = np.radians(head_pose.pitch)

        # Spherical to Cartesian direction vector
        gaze_x = np.sin(yaw_rad) * np.cos(pitch_rad)
        gaze_y = -np.sin(pitch_rad)
        gaze_z = np.cos(yaw_rad) * np.cos(pitch_rad)

        # Refine with eye landmarks if available
        if eye_landmarks is not None and len(eye_landmarks) >= 4:
            # Compute iris offset from eye center → micro-gaze adjustment
            left_center = eye_landmarks[:2].mean(axis=0)
            right_center = eye_landmarks[2:4].mean(axis=0)
            iris_offset_x = (left_center[0] + right_center[0]) / 2 - 0.5
            iris_offset_y = (left_center[1] + right_center[1]) / 2 - 0.5

            gaze_x += self.eye_weight * iris_offset_x
            gaze_y += self.eye_weight * iris_offset_y

        # Normalize
        gaze_vec = np.array([gaze_x, gaze_y, gaze_z])
        norm = np.linalg.norm(gaze_vec)
        if norm > 0:
            gaze_vec = gaze_vec / norm

        # Classify target
        target_name = self._classify_target(head_pose.yaw, head_pose.pitch)

        return GazeResult(
            gaze_vector=tuple(gaze_vec),
            gaze_target=target_name,
            confidence=head_pose.confidence,
            track_id=head_pose.track_id,
            yaw=head_pose.yaw,
            pitch=head_pose.pitch,
        )

    def _classify_target(self, yaw: float, pitch: float) -> str:
        """Rule-based gaze target classification from head angles."""
        # Looking far away
        if abs(yaw) > 50:
            return "away"
        if abs(yaw) > 35:
            return "other_student"

        # Looking down significantly → phone or laptop
        if pitch > 25:
            if pitch > 40:
                return "phone"
            return "laptop"

        # Looking up → board
        if pitch < -10:
            return "board"

        # Looking roughly forward → teacher
        if abs(yaw) < 25 and -10 <= pitch <= 15:
            return "teacher"

        return "away"

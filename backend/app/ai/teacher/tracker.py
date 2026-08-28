"""
Teacher Analytics — Tracking, Heatmaps & Teaching Metrics

Tracks teacher-specific movement patterns, speaking time, board usage,
student interaction zones, and generates spatial heatmaps for
teaching behavior analysis.
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict
from collections import deque
from loguru import logger


@dataclass
class TeacherMetrics:
    """Aggregated teaching metrics for a session."""
    total_speaking_time: float = 0.0     # seconds
    total_silent_time: float = 0.0
    board_usage_time: float = 0.0        # seconds at/near board
    interaction_count: int = 0            # Student interactions detected
    movement_distance: float = 0.0        # Total meters walked
    zone_distribution: Dict[str, float] = field(default_factory=dict)  # zone → % time
    avg_position: Tuple[float, float] = (0.5, 0.5)
    movement_variety: float = 0.0         # std of positions (higher = more movement)

    def to_dict(self) -> dict:
        return {
            "speaking_time_sec": round(self.total_speaking_time, 1),
            "silent_time_sec": round(self.total_silent_time, 1),
            "speaking_ratio": round(self.speaking_ratio, 3),
            "board_usage_sec": round(self.board_usage_time, 1),
            "interactions": self.interaction_count,
            "movement_meters": round(self.movement_distance, 2),
            "zone_distribution": {k: round(v, 3) for k, v in self.zone_distribution.items()},
            "movement_variety": round(self.movement_variety, 4),
        }

    @property
    def speaking_ratio(self) -> float:
        total = self.total_speaking_time + self.total_silent_time
        return self.total_speaking_time / total if total > 0 else 0.0


class TeacherTracker:
    """
    Teacher-specific tracker and analytics engine.

    Tracks teacher position over time, detects teaching zones
    (front, board, sides, among-students), and computes
    engagement-relevant metrics.

    Args:
        fps: Camera frame rate for time calculations
        heatmap_resolution: Grid resolution for spatial heatmap (rows, cols)
    """

    # Teaching zones (normalized coordinates)
    ZONES = {
        "board": (0.2, 0.0, 0.8, 0.15),       # Near whiteboard/screen
        "front_center": (0.3, 0.15, 0.7, 0.35), # Front of classroom
        "left_side": (0.0, 0.15, 0.3, 0.7),
        "right_side": (0.7, 0.15, 1.0, 0.7),
        "among_students": (0.1, 0.35, 0.9, 0.85), # Student area
        "back": (0.2, 0.85, 0.8, 1.0),
    }

    def __init__(self, fps: float = 15.0, heatmap_resolution: Tuple[int, int] = (20, 30)):
        self.fps = fps
        self.heatmap_res = heatmap_resolution
        self._position_history: deque = deque(maxlen=int(fps * 3600))  # 1hr max
        self._speaking_frames = 0
        self._silent_frames = 0
        self._board_frames = 0
        self._interaction_count = 0
        self._zone_frames: Dict[str, int] = {z: 0 for z in self.ZONES}
        self._heatmap = np.zeros(heatmap_resolution, dtype=np.float32)

    def update(
        self,
        position: Tuple[float, float],  # Normalized (x, y) in [0, 1]
        is_speaking: bool = False,
        near_student: bool = False,
    ):
        """
        Update teacher tracking with a new frame observation.

        Args:
            position: Teacher center position (normalized)
            is_speaking: Whether the teacher is currently speaking
            near_student: Whether the teacher is near a student (interaction)
        """
        self._position_history.append(position)

        # Speaking/silent tracking
        if is_speaking:
            self._speaking_frames += 1
        else:
            self._silent_frames += 1

        # Zone classification
        zone = self._classify_zone(position)
        if zone:
            self._zone_frames[zone] = self._zone_frames.get(zone, 0) + 1

        if zone == "board":
            self._board_frames += 1

        # Interaction detection
        if near_student and zone == "among_students":
            self._interaction_count += 1

        # Heatmap update
        row = min(int(position[1] * self.heatmap_res[0]), self.heatmap_res[0] - 1)
        col = min(int(position[0] * self.heatmap_res[1]), self.heatmap_res[1] - 1)
        self._heatmap[row, col] += 1.0

    def _classify_zone(self, pos: Tuple[float, float]) -> Optional[str]:
        """Classify position into a teaching zone."""
        x, y = pos
        for zone_name, (x1, y1, x2, y2) in self.ZONES.items():
            if x1 <= x <= x2 and y1 <= y <= y2:
                return zone_name
        return None

    def get_metrics(self) -> TeacherMetrics:
        """Compute aggregated teacher metrics from observations."""
        positions = np.array(self._position_history) if self._position_history else np.array([[0.5, 0.5]])

        # Movement distance
        if len(positions) > 1:
            diffs = np.diff(positions, axis=0)
            movement = float(np.sum(np.linalg.norm(diffs, axis=1)))
        else:
            movement = 0.0

        # Zone distribution
        total_zone_frames = sum(self._zone_frames.values())
        zone_dist = {z: f / total_zone_frames if total_zone_frames > 0 else 0.0
                     for z, f in self._zone_frames.items()}

        return TeacherMetrics(
            total_speaking_time=self._speaking_frames / self.fps,
            total_silent_time=self._silent_frames / self.fps,
            board_usage_time=self._board_frames / self.fps,
            interaction_count=self._interaction_count,
            movement_distance=movement * 10.0,  # Scale to approximate meters
            zone_distribution=zone_dist,
            avg_position=tuple(positions.mean(axis=0)),
            movement_variety=float(np.std(positions)),
        )

    def get_heatmap(self) -> np.ndarray:
        """Get normalized position heatmap [0, 1]."""
        max_val = self._heatmap.max()
        return self._heatmap / max_val if max_val > 0 else self._heatmap

    def get_movement_path(self, sample_every: int = 15) -> List[Tuple[float, float]]:
        """Get sampled movement path for visualization."""
        positions = list(self._position_history)
        return positions[::sample_every]

    def reset(self):
        self._position_history.clear()
        self._speaking_frames = 0
        self._silent_frames = 0
        self._board_frames = 0
        self._interaction_count = 0
        self._zone_frames = {z: 0 for z in self.ZONES}
        self._heatmap = np.zeros(self.heatmap_res, dtype=np.float32)

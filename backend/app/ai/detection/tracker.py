"""
ByteTrack Multi-Person Tracker

Assigns persistent tracking IDs across frames using the BYTE association
strategy: matches high-confidence detections first, then re-associates
low-confidence detections with unmatched tracks.

Reference: Zhang et al., "ByteTrack: Multi-Object Tracking by Associating
Every Detection Box" (ECCV 2022).
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from loguru import logger

from app.ai.detection.detector import Detection


def _iou(box_a: Tuple, box_b: Tuple) -> float:
    """Compute IoU between two (x1, y1, x2, y2) bounding boxes."""
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])

    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union_area = area_a + area_b - inter_area

    return inter_area / union_area if union_area > 0 else 0.0


@dataclass
class Track:
    """An active track with persistent identity."""
    track_id: int
    bbox: Tuple[float, float, float, float]
    confidence: float
    age: int = 0                    # Frames since creation
    hits: int = 1                   # Total successful matches
    time_since_update: int = 0      # Frames since last matched
    velocity: Tuple[float, float] = (0.0, 0.0)  # Estimated (vx, vy)
    _prev_center: Optional[Tuple[float, float]] = field(default=None, repr=False)

    @property
    def center(self) -> Tuple[float, float]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def predict_next_bbox(self) -> Tuple[float, float, float, float]:
        """Predict next position using constant velocity model."""
        vx, vy = self.velocity
        x1, y1, x2, y2 = self.bbox
        return (x1 + vx, y1 + vy, x2 + vx, y2 + vy)

    def update(self, detection: Detection):
        """Update track with a matched detection."""
        old_center = self.center
        self.bbox = detection.bbox
        self.confidence = detection.confidence
        new_center = self.center
        self.velocity = (new_center[0] - old_center[0], new_center[1] - old_center[1])
        self.hits += 1
        self.time_since_update = 0
        self.age += 1


class ByteTracker:
    """
    ByteTrack multi-object tracker with two-stage association.

    Stage 1: Match high-confidence detections (>= high_thresh) to existing tracks via IoU.
    Stage 2: Match remaining low-confidence detections to unmatched tracks.
    Unmatched detections spawn new tracks; stale tracks are removed.

    Args:
        high_thresh: Confidence threshold for first association pass
        low_thresh: Minimum confidence to consider detection at all
        iou_threshold: IoU threshold for matching
        max_age: Maximum frames a track can be unmatched before removal
        min_hits: Minimum hits before a track is confirmed (output)
    """

    def __init__(
        self,
        high_thresh: float = 0.6,
        low_thresh: float = 0.1,
        iou_threshold: float = 0.3,
        max_age: int = 30,
        min_hits: int = 3,
    ):
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.min_hits = min_hits

        self._tracks: List[Track] = []
        self._next_id = 1
        self._frame_count = 0

    @property
    def active_track_count(self) -> int:
        return len(self._tracks)

    def update(self, detections: List[Detection]) -> List[Detection]:
        """
        Process detections for one frame and return detections with assigned track IDs.

        Args:
            detections: Raw detections from the detector

        Returns:
            List of Detections with track_id assigned to confirmed tracks
        """
        self._frame_count += 1

        # Split detections by confidence
        high_dets = [d for d in detections if d.confidence >= self.high_thresh]
        low_dets = [d for d in detections if self.low_thresh <= d.confidence < self.high_thresh]

        # Predict track positions
        for track in self._tracks:
            track.age += 1
            track.time_since_update += 1

        # Stage 1: Associate high-confidence detections
        matched_track_indices, matched_det_indices, unmatched_tracks, unmatched_dets = \
            self._associate(self._tracks, high_dets, self.iou_threshold)

        # Update matched tracks
        for t_idx, d_idx in zip(matched_track_indices, matched_det_indices):
            self._tracks[t_idx].update(high_dets[d_idx])

        # Stage 2: Associate low-confidence detections with remaining unmatched tracks
        remaining_tracks = [self._tracks[i] for i in unmatched_tracks]
        matched_t2, matched_d2, still_unmatched_tracks, _ = \
            self._associate(remaining_tracks, low_dets, self.iou_threshold)

        for t_idx, d_idx in zip(matched_t2, matched_d2):
            remaining_tracks[t_idx].update(low_dets[d_idx])

        # Spawn new tracks from unmatched high-confidence detections
        for d_idx in unmatched_dets:
            det = high_dets[d_idx]
            new_track = Track(
                track_id=self._next_id,
                bbox=det.bbox,
                confidence=det.confidence,
            )
            self._tracks.append(new_track)
            self._next_id += 1

        # Remove stale tracks
        self._tracks = [t for t in self._tracks if t.time_since_update <= self.max_age]

        # Output confirmed tracks
        output: List[Detection] = []
        for track in self._tracks:
            if track.hits >= self.min_hits and track.time_since_update == 0:
                det = Detection(
                    bbox=track.bbox,
                    confidence=track.confidence,
                )
                det.track_id = track.track_id
                output.append(det)

        return output

    def _associate(
        self,
        tracks: List[Track],
        detections: List[Detection],
        threshold: float,
    ) -> Tuple[List[int], List[int], List[int], List[int]]:
        """
        Greedy IoU-based association between tracks and detections.
        Returns (matched_track_indices, matched_det_indices, unmatched_tracks, unmatched_dets).
        """
        if not tracks or not detections:
            return [], [], list(range(len(tracks))), list(range(len(detections)))

        # Build IoU cost matrix
        n_tracks = len(tracks)
        n_dets = len(detections)
        iou_matrix = np.zeros((n_tracks, n_dets))

        for t_idx, track in enumerate(tracks):
            predicted_bbox = track.predict_next_bbox()
            for d_idx, det in enumerate(detections):
                iou_matrix[t_idx, d_idx] = _iou(predicted_bbox, det.bbox)

        # Greedy matching (highest IoU first)
        matched_t: List[int] = []
        matched_d: List[int] = []
        used_tracks = set()
        used_dets = set()

        # Flatten and sort by IoU descending
        indices = np.dstack(np.unravel_index(np.argsort(iou_matrix.ravel())[::-1], iou_matrix.shape))[0]

        for t_idx, d_idx in indices:
            t_idx, d_idx = int(t_idx), int(d_idx)
            if t_idx in used_tracks or d_idx in used_dets:
                continue
            if iou_matrix[t_idx, d_idx] < threshold:
                break
            matched_t.append(t_idx)
            matched_d.append(d_idx)
            used_tracks.add(t_idx)
            used_dets.add(d_idx)

        unmatched_tracks = [i for i in range(n_tracks) if i not in used_tracks]
        unmatched_dets = [i for i in range(n_dets) if i not in used_dets]

        return matched_t, matched_d, unmatched_tracks, unmatched_dets

    def reset(self):
        """Reset all tracks."""
        self._tracks = []
        self._next_id = 1
        self._frame_count = 0
        logger.info("Tracker reset")

"""
Seat Mapper — Maps detected person positions to predefined seat grid.

Given a room layout (JSON seat map) and detected person bounding box centers,
assigns each person to the nearest available seat using distance thresholding.
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Optional, Dict, Tuple
from loguru import logger

from app.ai.detection.detector import Detection


@dataclass
class Seat:
    """A seat in the classroom grid."""
    seat_id: str             # e.g., "A1", "B3"
    row: int
    col: int
    position_2d: Tuple[float, float]  # (x, y) pixel coords in camera view
    position_3d: Optional[Tuple[float, float, float]] = None  # (x, y, z) in meters
    occupied: bool = False
    assigned_track_id: Optional[int] = None


class SeatMapper:
    """
    Maps person detections to predefined seat positions.

    Uses nearest-neighbor assignment with a maximum distance threshold
    to prevent false matches from distant detections.

    Args:
        max_distance: Maximum pixel distance for a valid seat assignment
    """

    def __init__(self, max_distance: float = 100.0):
        self.max_distance = max_distance
        self.seats: Dict[str, Seat] = {}

    def load_seat_map(self, seat_map_json: dict):
        """
        Load seat layout from room configuration JSON.

        Expected format:
        {
            "seats": [
                {"id": "A1", "row": 0, "col": 0, "x": 120, "y": 300},
                {"id": "A2", "row": 0, "col": 1, "x": 240, "y": 300},
                ...
            ]
        }
        """
        self.seats.clear()
        for seat_data in seat_map_json.get("seats", []):
            seat = Seat(
                seat_id=seat_data["id"],
                row=seat_data.get("row", 0),
                col=seat_data.get("col", 0),
                position_2d=(seat_data["x"], seat_data["y"]),
                position_3d=tuple(seat_data["pos_3d"]) if "pos_3d" in seat_data else None,
            )
            self.seats[seat.seat_id] = seat

        logger.info(f"Loaded seat map with {len(self.seats)} seats")

    def generate_grid(self, rows: int, cols: int, origin: Tuple[float, float],
                      spacing_x: float = 120.0, spacing_y: float = 100.0):
        """Generate a regular rectangular seat grid for quick setup."""
        self.seats.clear()
        for r in range(rows):
            for c in range(cols):
                seat_id = f"{chr(65 + r)}{c + 1}"
                x = origin[0] + c * spacing_x
                y = origin[1] + r * spacing_y
                self.seats[seat_id] = Seat(
                    seat_id=seat_id, row=r, col=c, position_2d=(x, y)
                )
        logger.info(f"Generated {rows}x{cols} seat grid ({len(self.seats)} seats)")

    def assign_seats(self, detections: List[Detection]) -> Dict[int, str]:
        """
        Assign detected persons to seats using nearest-neighbor matching.

        Args:
            detections: Tracked detections with track_id set

        Returns:
            Mapping of track_id → seat_id for all assigned persons
        """
        # Reset occupancy
        for seat in self.seats.values():
            seat.occupied = False
            seat.assigned_track_id = None

        if not self.seats or not detections:
            return {}

        seat_list = list(self.seats.values())
        seat_positions = np.array([s.position_2d for s in seat_list])
        det_centers = np.array([d.center for d in detections])

        # Compute distance matrix (n_dets x n_seats)
        distances = np.linalg.norm(
            det_centers[:, None, :] - seat_positions[None, :, :], axis=2
        )

        assignments: Dict[int, str] = {}
        used_seats = set()

        # Greedy assignment by shortest distance
        flat_indices = np.argsort(distances.ravel())
        for flat_idx in flat_indices:
            d_idx = int(flat_idx // len(seat_list))
            s_idx = int(flat_idx % len(seat_list))
            dist = distances[d_idx, s_idx]

            if dist > self.max_distance:
                break

            det = detections[d_idx]
            seat = seat_list[s_idx]

            if det.track_id in assignments or seat.seat_id in used_seats:
                continue

            seat.occupied = True
            seat.assigned_track_id = det.track_id
            assignments[det.track_id] = seat.seat_id
            used_seats.add(seat.seat_id)

        return assignments

    @property
    def occupancy_count(self) -> int:
        return sum(1 for s in self.seats.values() if s.occupied)

    @property
    def capacity(self) -> int:
        return len(self.seats)

    @property
    def utilization(self) -> float:
        return self.occupancy_count / self.capacity if self.capacity > 0 else 0.0

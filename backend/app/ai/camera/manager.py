"""
Multi-Camera Management — Synchronization, Calibration & Simulation

Manages multiple camera streams with frame synchronization,
intrinsic/extrinsic calibration, and a demo simulator that
generates synthetic frames for offline development.
"""
import numpy as np
import time
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Generator
from collections import deque
from loguru import logger

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("cv2 not installed. Camera module will use mock mode.")


@dataclass
class CameraConfig:
    """Configuration for a single camera."""
    camera_id: str
    name: str
    source: str         # RTSP URL, file path, or 'mock'
    resolution: Tuple[int, int] = (1920, 1080)
    fps: float = 15.0
    enabled: bool = True
    intrinsic_matrix: Optional[np.ndarray] = None
    distortion_coeffs: Optional[np.ndarray] = None
    extrinsic_matrix: Optional[np.ndarray] = None  # 4x4 world → camera transform


class RTSPCameraStream:
    """
    Asynchronous RTSP/Webcam camera stream reader.
    Runs a background thread to continuously fetch frames, preventing
    blocking and accumulation delay in the processing pipeline.
    """

    def __init__(self, source: str, resolution: Tuple[int, int] = (1280, 720)):
        self.source = source
        self.resolution = resolution
        self.frame: Optional[np.ndarray] = None
        self.stopped = False
        self.thread: Optional[threading.Thread] = None
        self.cap = None

    def start(self):
        """Start the background frame reader thread."""
        if not CV2_AVAILABLE:
            logger.error("cv2 is not installed. Cannot start RTSP stream.")
            return self
            
        try:
            # Check if source is a digit (webcam index)
            if self.source.isdigit():
                src = int(self.source)
            else:
                src = self.source
                
            self.cap = cv2.VideoCapture(src)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        except Exception as e:
            logger.error(f"Error opening camera source {self.source}: {str(e)}")
            return self

        self.stopped = False
        self.thread = threading.Thread(target=self._update, args=())
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"Started asynchronous reader thread for RTSP/webcam stream: {self.source}")
        return self

    def _update(self):
        """Continuously capture frames in the background."""
        while not self.stopped:
            if self.cap is None or not self.cap.isOpened():
                break
                
            ret, frame = self.cap.read()
            if not ret:
                logger.warning(f"Failed to retrieve frame from camera source: {self.source}")
                time.sleep(0.01)
                continue
                
            self.frame = frame
            time.sleep(0.001)  # Minimal sleep to prevent CPU hogging

    def read(self) -> Optional[np.ndarray]:
        """Return the latest frame from the buffer."""
        return self.frame

    def stop(self):
        """Stop the reader thread and release capture resource."""
        self.stopped = True
        if self.thread is not None:
            self.thread.join(timeout=1.0)
        if self.cap is not None:
            self.cap.release()
        logger.info(f"Stopped RTSP/webcam stream: {self.source}")


@dataclass
class SyncFrame:
    """A time-synchronized frame bundle from multiple cameras."""
    timestamp: float
    frames: Dict[str, np.ndarray]  # camera_id → frame
    frame_index: int = 0


class CameraCalibrator:
    """
    Camera intrinsic/extrinsic calibration using checkerboard patterns.

    Supports:
    - Intrinsic calibration (focal length, principal point, distortion)
    - Extrinsic calibration (camera pose in world coordinates)
    - Undistortion of frames
    """

    def __init__(self, board_size: Tuple[int, int] = (9, 6), square_size: float = 0.025):
        self.board_size = board_size
        self.square_size = square_size  # meters

    def calibrate_intrinsics(
        self,
        calibration_images: List[np.ndarray],
    ) -> Optional[Tuple[np.ndarray, np.ndarray]]:
        """
        Calibrate camera intrinsics from checkerboard images.

        Returns:
            Tuple of (camera_matrix, distortion_coefficients) or None if failed
        """
        if not CV2_AVAILABLE:
            logger.warning("cv2 not available — returning mock calibration")
            return self._mock_intrinsics(calibration_images[0].shape[:2] if calibration_images else (1080, 1920))

        obj_points: List[np.ndarray] = []
        img_points: List[np.ndarray] = []

        objp = np.zeros((self.board_size[0] * self.board_size[1], 3), np.float32)
        objp[:, :2] = np.mgrid[0:self.board_size[0], 0:self.board_size[1]].T.reshape(-1, 2)
        objp *= self.square_size

        for img in calibration_images:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            found, corners = cv2.findChessboardCorners(gray, self.board_size, None)

            if found:
                corners_refined = cv2.cornerSubPix(
                    gray, corners, (11, 11), (-1, -1),
                    (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001),
                )
                obj_points.append(objp)
                img_points.append(corners_refined)

        if len(obj_points) < 3:
            logger.warning(f"Only {len(obj_points)} valid calibration images. Need >= 3.")
            return None

        h, w = calibration_images[0].shape[:2]
        ret, cam_matrix, dist_coeffs, _, _ = cv2.calibrateCamera(
            obj_points, img_points, (w, h), None, None,
        )

        logger.info(f"Calibration complete. RMS error: {ret:.4f}")
        return cam_matrix, dist_coeffs

    def undistort(
        self,
        frame: np.ndarray,
        cam_matrix: np.ndarray,
        dist_coeffs: np.ndarray,
    ) -> np.ndarray:
        """Remove lens distortion from a frame."""
        if not CV2_AVAILABLE:
            return frame
        h, w = frame.shape[:2]
        new_cam, roi = cv2.getOptimalNewCameraMatrix(cam_matrix, dist_coeffs, (w, h), 1, (w, h))
        return cv2.undistort(frame, cam_matrix, dist_coeffs, None, new_cam)

    def _mock_intrinsics(self, shape: Tuple[int, int]) -> Tuple[np.ndarray, np.ndarray]:
        h, w = shape
        cam_matrix = np.array([
            [w, 0, w / 2],
            [0, w, h / 2],
            [0, 0, 1],
        ], dtype=np.float64)
        return cam_matrix, np.zeros((4, 1), dtype=np.float64)


class FrameSynchronizer:
    """
    Synchronizes frames from multiple cameras by nearest-timestamp matching.

    Buffers incoming frames and releases synchronized bundles when
    all cameras have frames within the tolerance window.

    Args:
        camera_ids: List of camera IDs to synchronize
        tolerance_ms: Maximum timestamp difference for sync (milliseconds)
    """

    def __init__(self, camera_ids: List[str], tolerance_ms: float = 50.0):
        self.camera_ids = camera_ids
        self.tolerance = tolerance_ms / 1000.0
        self._buffers: Dict[str, deque] = {cid: deque(maxlen=30) for cid in camera_ids}
        self._frame_counter = 0

    def add_frame(self, camera_id: str, frame: np.ndarray, timestamp: Optional[float] = None):
        """Add a new frame from a camera."""
        ts = timestamp or time.time()
        if camera_id in self._buffers:
            self._buffers[camera_id].append((ts, frame))

    def get_synchronized(self) -> Optional[SyncFrame]:
        """
        Attempt to produce a synchronized frame bundle.

        Returns:
            SyncFrame if all cameras have frames within tolerance, else None
        """
        # Check all buffers have at least one frame
        if any(len(buf) == 0 for buf in self._buffers.values()):
            return None

        # Use latest frame from first camera as anchor
        anchor_id = self.camera_ids[0]
        anchor_ts, anchor_frame = self._buffers[anchor_id][-1]

        sync_frames: Dict[str, np.ndarray] = {anchor_id: anchor_frame}

        for cam_id in self.camera_ids[1:]:
            buffer = self._buffers[cam_id]
            best_frame = None
            best_dt = float("inf")

            for ts, frame in buffer:
                dt = abs(ts - anchor_ts)
                if dt < best_dt:
                    best_dt = dt
                    best_frame = frame

            if best_dt > self.tolerance or best_frame is None:
                return None

            sync_frames[cam_id] = best_frame

        self._frame_counter += 1

        # Clear consumed frames
        for cam_id in self.camera_ids:
            if self._buffers[cam_id]:
                self._buffers[cam_id].popleft()

        return SyncFrame(
            timestamp=anchor_ts,
            frames=sync_frames,
            frame_index=self._frame_counter,
        )


class DemoSimulator:
    """
    Generates synthetic video frames for development and demo purposes.

    Creates frames with colored rectangles representing students and
    a teacher in a classroom layout. Supports controllable scenarios
    for testing the full pipeline without real cameras.

    Args:
        resolution: Output frame size (W, H)
        fps: Simulated frame rate
        n_students: Number of synthetic students
    """

    def __init__(
        self,
        resolution: Tuple[int, int] = (1280, 720),
        fps: float = 15.0,
        n_students: int = 8,
    ):
        self.resolution = resolution
        self.fps = fps
        self.n_students = n_students
        self._frame_idx = 0

    def generate_frame(self) -> np.ndarray:
        """Generate a single synthetic classroom frame."""
        w, h = self.resolution
        frame = np.full((h, w, 3), 40, dtype=np.uint8)  # Dark background

        rng = np.random.RandomState(self._frame_idx % 1000)

        # Draw whiteboard (top area)
        frame[20:120, w // 4 : 3 * w // 4] = [220, 220, 220]

        # Draw teacher (blue rectangle, front center)
        tx = w // 2 + int(20 * np.sin(self._frame_idx * 0.05))
        ty = 180
        frame[ty:ty + 120, tx - 30:tx + 30] = [200, 100, 50]  # Blue-ish

        # Draw students (colored rectangles in grid)
        cols = 4
        rows = (self.n_students + cols - 1) // cols
        for i in range(self.n_students):
            row = i // cols
            col = i % cols

            sx = int((col + 0.5) * w / cols) + rng.randint(-10, 10)
            sy = 300 + row * 130 + rng.randint(-5, 5)

            # Color by simulated engagement
            engagement = rng.uniform(0.3, 1.0)
            color = (
                int(50 + 150 * (1 - engagement)),  # Red for low
                int(50 + 200 * engagement),          # Green for high
                80,
            )
            frame[sy:sy + 100, sx - 25:sx + 25] = color

        self._frame_idx += 1
        return frame

    def stream(self, n_frames: int = 300) -> Generator[np.ndarray, None, None]:
        """Generate a stream of synthetic frames."""
        for _ in range(n_frames):
            yield self.generate_frame()
            time.sleep(1.0 / self.fps)

    def reset(self):
        self._frame_idx = 0

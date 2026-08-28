"""
CV Pipeline Orchestrator — Unified Frame Processing Pipeline

Wires together all 10 computer vision modules into a single
frame-processing pipeline that takes a raw camera frame and produces
a complete per-student state snapshot.

Pipeline stages:
  1. Person Detection (YOLO26)
  2. Multi-Person Tracking (ByteTrack)
  3. Seat Mapping
  4. Face Recognition (InsightFace)
  5. Pose Estimation (MediaPipe)
  6. Head Pose (PnP from Face Mesh)
  7. Gaze Tracking (Head pose + Eye landmarks)
  8. Emotion Recognition (HuggingFace Transformers)
  9. Activity Classification (Pose heuristics + model)
  10. Environment Analysis (Brightness, noise, occupancy)
"""
import time
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from loguru import logger

from app.ai.detection.detector import PersonDetector, Detection
from app.ai.detection.tracker import ByteTracker
from app.ai.detection.seat_mapper import SeatMapper
from app.ai.face.recognizer import FaceRecognizer
from app.ai.face.anonymizer import FaceAnonymizer
from app.ai.pose.estimator import PoseEstimator, PoseHistory
from app.ai.head_pose.estimator import HeadPoseEstimator
from app.ai.gaze.estimator import GazeEstimator
from app.ai.emotion.recognizer import EmotionRecognizer, EmotionTimeline
from app.ai.activity.classifier import ActivityClassifier
from app.ai.teacher.tracker import TeacherTracker
from app.ai.environment.analyzer import EnvironmentAnalyzer


@dataclass
class PersonSnapshot:
    """Complete per-person state from one frame processing pass."""
    track_id: int
    bbox: tuple
    identity_id: Optional[int] = None
    identity_name: Optional[str] = None
    seat_id: Optional[str] = None
    pose_confidence: float = 0.0
    head_yaw: float = 0.0
    head_pitch: float = 0.0
    head_roll: float = 0.0
    gaze_target: str = "unknown"
    gaze_confidence: float = 0.0
    dominant_emotion: str = "neutral"
    emotion_confidence: float = 0.0
    activity: str = "listening"
    activity_confidence: float = 0.0
    is_teacher: bool = False

    def to_dict(self) -> dict:
        return {
            "track_id": self.track_id,
            "bbox": list(self.bbox) if self.bbox else [],
            "identity_id": self.identity_id,
            "identity_name": self.identity_name,
            "seat_id": self.seat_id,
            "head_pose": {"yaw": round(self.head_yaw, 2), "pitch": round(self.head_pitch, 2), "roll": round(self.head_roll, 2)},
            "gaze": {"target": self.gaze_target, "confidence": round(self.gaze_confidence, 3)},
            "emotion": {"dominant": self.dominant_emotion, "confidence": round(self.emotion_confidence, 3)},
            "activity": {"label": self.activity, "confidence": round(self.activity_confidence, 3)},
            "is_teacher": self.is_teacher,
        }


@dataclass
class FrameResult:
    """Complete result from processing one frame through the full pipeline."""
    frame_index: int
    timestamp: float
    persons: List[PersonSnapshot]
    environment: dict
    teacher_metrics: Optional[dict] = None
    processing_time_ms: float = 0.0

    @property
    def student_count(self) -> int:
        return sum(1 for p in self.persons if not p.is_teacher)

    @property
    def teacher_detected(self) -> bool:
        return any(p.is_teacher for p in self.persons)

    def to_dict(self) -> dict:
        return {
            "frame_index": self.frame_index,
            "timestamp": self.timestamp,
            "persons": [p.to_dict() for p in self.persons],
            "student_count": self.student_count,
            "environment": self.environment,
            "teacher_metrics": self.teacher_metrics,
            "processing_time_ms": round(self.processing_time_ms, 2),
        }


class CVPipeline:
    """
    Unified Computer Vision Pipeline Orchestrator.

    Initializes and coordinates all CV modules, processing each frame
    through the full detection → recognition → analysis pipeline.

    Args:
        detector_model_size: YOLO model size ('n', 's', 'm', 'l')
        confidence_threshold: Detection confidence minimum
        room_capacity: Classroom seat capacity
        enable_face: Enable face recognition module
        enable_emotion: Enable emotion recognition module
        enable_anonymizer: Enable face anonymization for privacy
        teacher_track_id: Known teacher track ID (if pre-identified)
    """

    def __init__(
        self,
        detector_model_size: str = "n",
        confidence_threshold: float = 0.45,
        room_capacity: int = 40,
        enable_face: bool = True,
        enable_emotion: bool = True,
        enable_anonymizer: bool = False,
        teacher_track_id: Optional[int] = None,
    ):
        self._frame_index = 0
        self._teacher_track_id = teacher_track_id

        # ── Module Initialization ──
        logger.info("Initializing CV Pipeline modules...")

        self.detector = PersonDetector(
            model_size=detector_model_size,
            confidence_threshold=confidence_threshold,
        )
        self.tracker = ByteTracker()
        self.seat_mapper = SeatMapper(max_distance=10000.0)
        # Initialize default classroom seat layout grid (30 capacity)
        self.seat_mapper.generate_grid(
            rows=5,
            cols=6,
            origin=(200.0, 300.0),
            spacing_x=140.0,
            spacing_y=110.0
        )

        self.face_recognizer = FaceRecognizer() if enable_face else None
        self.anonymizer = FaceAnonymizer() if enable_anonymizer else None

        self.pose_estimator = PoseEstimator()
        self.pose_history = PoseHistory()

        self.head_pose_estimator = HeadPoseEstimator()
        self.gaze_estimator = GazeEstimator()

        self.emotion_recognizer = EmotionRecognizer() if enable_emotion else None
        self.emotion_timeline = EmotionTimeline() if enable_emotion else None

        self.activity_classifier = ActivityClassifier()
        self.teacher_tracker = TeacherTracker()
        self.environment_analyzer = EnvironmentAnalyzer(capacity=room_capacity)

        logger.info("CV Pipeline initialized successfully")

    def process_frame(
        self,
        frame: np.ndarray,
        audio_chunk: Optional[np.ndarray] = None,
    ) -> FrameResult:
        """
        Process a single frame through the full CV pipeline.

        Args:
            frame: BGR camera frame (H, W, 3)
            audio_chunk: Optional audio samples for environment analysis

        Returns:
            FrameResult with all per-person states and environment metrics
        """
        t_start = time.perf_counter()
        self._frame_index += 1
        h, w = frame.shape[:2]

        # ── Stage 1: Detection ──
        raw_detections = self.detector.detect(frame)

        # ── Stage 2: Tracking ──
        tracked = self.tracker.update(raw_detections)

        # ── Stage 3: Seat Mapping ──
        seat_assignments = self.seat_mapper.assign_seats(tracked)

        # ── Stage 4-9: Per-Person Analysis ──
        persons: List[PersonSnapshot] = []

        for det in tracked:
            snapshot = PersonSnapshot(
                track_id=det.track_id,
                bbox=det.bbox,
                seat_id=seat_assignments.get(det.track_id),
            )

            # Crop person region
            x1 = max(0, int(det.bbox[0]))
            y1 = max(0, int(det.bbox[1]))
            x2 = min(w, int(det.bbox[2]))
            y2 = min(h, int(det.bbox[3]))

            if x2 <= x1 or y2 <= y1:
                persons.append(snapshot)
                continue

            person_crop = frame[y1:y2, x1:x2]

            # Face Recognition (Stage 4)
            if self.face_recognizer is not None:
                face_results = self.face_recognizer.detect_and_embed(person_crop)
                if face_results:
                    best_face = face_results[0]
                    snapshot.identity_id = best_face.identity_id
                    snapshot.identity_name = best_face.identity_name

            # Pose Estimation (Stage 5)
            pose = self.pose_estimator.estimate(person_crop, track_id=det.track_id)
            if pose:
                self.pose_history.update(pose)
                snapshot.pose_confidence = pose.confidence

                # Head Pose (Stage 6)
                # Use upper portion of crop for face
                face_h = max(1, int((y2 - y1) * 0.4))
                face_crop = person_crop[:face_h, :]
                head_pose = self.head_pose_estimator.estimate(face_crop, track_id=det.track_id)
                if head_pose:
                    snapshot.head_yaw = head_pose.yaw
                    snapshot.head_pitch = head_pose.pitch
                    snapshot.head_roll = head_pose.roll

                    # Gaze Tracking (Stage 7)
                    gaze = self.gaze_estimator.estimate(head_pose)
                    snapshot.gaze_target = gaze.gaze_target
                    snapshot.gaze_confidence = gaze.confidence

                # Activity Classification (Stage 9)
                activity = self.activity_classifier.classify(pose, self.pose_history)
                snapshot.activity = activity.activity
                snapshot.activity_confidence = activity.confidence

            # Emotion Recognition (Stage 8)
            if self.emotion_recognizer is not None:
                face_h = max(1, int((y2 - y1) * 0.35))
                face_roi = person_crop[:face_h, :]
                emotion = self.emotion_recognizer.recognize(face_roi, track_id=det.track_id)
                if self.emotion_timeline:
                    emotion = self.emotion_timeline.update(emotion)
                snapshot.dominant_emotion = emotion.dominant_emotion
                snapshot.emotion_confidence = emotion.confidence

            # Teacher detection
            if self._teacher_track_id and det.track_id == self._teacher_track_id:
                snapshot.is_teacher = True
                self.teacher_tracker.update(
                    position=(det.center[0] / w, det.center[1] / h),
                    is_speaking=False,  # Requires audio analysis
                )

            persons.append(snapshot)

        # ── Stage 10: Environment Analysis ──
        env = self.environment_analyzer.analyze(
            frame=frame,
            audio_chunk=audio_chunk,
            occupancy_count=len(tracked),
        )

        # Cleanup stale history
        active_ids = {d.track_id for d in tracked}
        self.pose_history.cleanup(active_ids)
        if self.emotion_timeline:
            self.emotion_timeline.cleanup(active_ids)

        t_end = time.perf_counter()

        return FrameResult(
            frame_index=self._frame_index,
            timestamp=time.time(),
            persons=persons,
            environment=env.to_dict(),
            teacher_metrics=self.teacher_tracker.get_metrics().to_dict() if self._teacher_track_id else None,
            processing_time_ms=(t_end - t_start) * 1000,
        )

    def warmup(self):
        """Warmup all models with a dummy frame."""
        dummy = np.zeros((480, 640, 3), dtype=np.uint8)
        self.process_frame(dummy)
        self._frame_index = 0
        logger.info("Pipeline warmup complete")

    def reset(self):
        """Reset all stateful components."""
        self.tracker.reset()
        self.pose_history = PoseHistory()
        if self.emotion_timeline:
            self.emotion_timeline = EmotionTimeline()
        self.teacher_tracker.reset()
        self._frame_index = 0
        logger.info("Pipeline reset")

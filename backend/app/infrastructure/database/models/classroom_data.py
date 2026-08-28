from datetime import datetime, UTC
from sqlalchemy import Float, String, DateTime, ForeignKey, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.infrastructure.database.session import Base
from app.core.constants import GazeTarget, EmotionType, ActivityType

class StudentDetection(Base):
    __tablename__ = "student_detections"
    __table_args__ = (Index("idx_detections_lecture_time", "lecture_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[Optional[int]] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    bbox_json: Mapped[dict] = mapped_column(JSON, nullable=False) # {x, y, w, h}
    position_3d_json: Mapped[dict] = mapped_column(JSON, nullable=False) # {x, y, z}
    seat_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tracking_id: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped[Optional["Student"]] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class PoseSnapshot(Base):
    __tablename__ = "pose_snapshots"
    __table_args__ = (Index("idx_pose_student_lecture_time", "student_id", "lecture_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    keypoints_json: Mapped[dict] = mapped_column(JSON, nullable=False) # 33 points
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class HeadPoseSnapshot(Base):
    __tablename__ = "head_pose_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    yaw: Mapped[float] = mapped_column(Float, nullable=False)
    pitch: Mapped[float] = mapped_column(Float, nullable=False)
    roll: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class GazeSnapshot(Base):
    __tablename__ = "gaze_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    gaze_vector_json: Mapped[dict] = mapped_column(JSON, nullable=False) # {x, y, z}
    gaze_target: Mapped[GazeTarget] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class EmotionSnapshot(Base):
    __tablename__ = "emotion_snapshots"
    __table_args__ = (Index("idx_emotion_student_lecture_time", "student_id", "lecture_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    emotions_json: Mapped[dict] = mapped_column(JSON, nullable=False) # {happy: 0.1, neutral: 0.8, ...}
    dominant_emotion: Mapped[EmotionType] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    activity_type: Mapped[ActivityType] = mapped_column(String(50), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

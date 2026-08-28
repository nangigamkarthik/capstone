from datetime import datetime, UTC
from sqlalchemy import Float, String, Boolean, DateTime, ForeignKey, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.infrastructure.database.session import Base
from app.core.constants import PredictionType

class EngagementScore(Base):
    __tablename__ = "engagement_scores"
    __table_args__ = (Index("idx_engagement_student_lecture_time", "student_id", "lecture_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    attention: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    engagement: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    participation: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    distraction: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    confusion: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    collaboration: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    overall_score: Mapped[float] = mapped_column(Float, nullable=False) # 0-100

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class TeacherAnalytics(Base):
    __tablename__ = "teacher_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    position_json: Mapped[dict] = mapped_column(JSON, nullable=False) # {x, y, z}
    is_speaking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    board_usage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    interaction_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    eye_contact_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    teaching_zone: Mapped[str] = mapped_column(String(50), nullable=False)
    movement_speed: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    teacher: Mapped["Teacher"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class EnvironmentMetrics(Base):
    __tablename__ = "environment_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    lighting_score: Mapped[float] = mapped_column(Float, nullable=False) # 0-100
    noise_level: Mapped[float] = mapped_column(Float, nullable=False) # dB
    occupancy: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    seat_utilization: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 - 1.0
    density_score: Mapped[float] = mapped_column(Float, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    lecture: Mapped["Lecture"] = relationship()

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    prediction_type: Mapped[PredictionType] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    explanations_json: Mapped[dict] = mapped_column(JSON, nullable=False) # list of {factor, weight, description}
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship()
    lecture: Mapped["Lecture"] = relationship()

class CopilotSuggestion(Base):
    __tablename__ = "copilot_suggestions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    suggestion_text: Mapped[str] = mapped_column(String(500), nullable=False)
    reasoning: Mapped[str] = mapped_column(String(1000), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False) # low, medium, high, critical
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    acted_upon: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    lecture: Mapped["Lecture"] = relationship()

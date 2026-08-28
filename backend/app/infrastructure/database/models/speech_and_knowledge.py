from datetime import datetime, UTC
from sqlalchemy import Float, String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.infrastructure.database.session import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    speaker_type: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False) # teacher, student, unknown
    speaker_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # student_id or teacher_id
    text: Mapped[str] = mapped_column(String(2000), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    keywords_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

    # Relationships
    lecture: Mapped["Lecture"] = relationship()

class LectureSummary(Base):
    __tablename__ = "lecture_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary_text: Mapped[str] = mapped_column(String(4000), nullable=False)
    topics_json: Mapped[dict] = mapped_column(JSON, nullable=False) # list of topics
    key_questions_json: Mapped[dict] = mapped_column(JSON, nullable=False) # list of questions
    action_items_json: Mapped[dict] = mapped_column(JSON, nullable=False) # list of actions
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    lecture: Mapped["Lecture"] = relationship()

class KGNode(Base):
    __tablename__ = "kg_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    node_type: Mapped[str] = mapped_column(String(50), nullable=False) # student, teacher, topic, assignment, etc.
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    properties_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

class KGEdge(Base):
    __tablename__ = "kg_edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_node_id: Mapped[int] = mapped_column(ForeignKey("kg_nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id: Mapped[int] = mapped_column(ForeignKey("kg_nodes.id", ondelete="CASCADE"), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    properties_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    source_node: Mapped["KGNode"] = relationship("KGNode", foreign_keys=[source_node_id])
    target_node: Mapped["KGNode"] = relationship("KGNode", foreign_keys=[target_node_id])

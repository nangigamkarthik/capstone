from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class EngagementBase(BaseModel):
    student_id: int
    lecture_id: int
    attention: float
    engagement: float
    participation: float
    distraction: float
    confusion: float
    collaboration: float
    overall_score: float

class EngagementResponse(EngagementBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class EngagementTimeline(BaseModel):
    student_id: int
    scores: List[EngagementResponse]

class StudentSummary(BaseModel):
    student_id: int
    student_name: str
    avg_attention: float
    avg_engagement: float
    avg_participation: float

class ClassroomEngagement(BaseModel):
    lecture_id: int
    timestamp: datetime
    avg_attention: float
    avg_engagement: float
    avg_participation: float
    student_summaries: List[StudentSummary]

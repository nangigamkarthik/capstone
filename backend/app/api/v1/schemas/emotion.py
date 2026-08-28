from pydantic import BaseModel, ConfigDict
from typing import Dict, List
from datetime import datetime
from app.core.constants import EmotionType

class EmotionResponse(BaseModel):
    id: int
    student_id: int
    lecture_id: int
    timestamp: datetime
    emotions_json: Dict[EmotionType, float]
    dominant_emotion: EmotionType
    confidence: float

    model_config = ConfigDict(from_attributes=True)

class EmotionTimeline(BaseModel):
    student_id: int
    timeline: List[EmotionResponse]

class ClassroomEmotionSummary(BaseModel):
    lecture_id: int
    timestamp: datetime
    dominant_emotion: EmotionType
    distribution: Dict[EmotionType, float]

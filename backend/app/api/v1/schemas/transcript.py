from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class TranscriptSegment(BaseModel):
    start_time: datetime
    end_time: datetime
    speaker_type: str
    speaker_id: Optional[int] = None
    text: str
    confidence: float
    keywords_json: Optional[List[str]] = None

class TranscriptResponse(BaseModel):
    id: int
    lecture_id: int
    segments: List[TranscriptSegment]

class LectureSummaryResponse(BaseModel):
    id: int
    lecture_id: int
    summary_text: str
    topics_json: List[str]
    key_questions_json: List[str]
    action_items_json: List[str]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

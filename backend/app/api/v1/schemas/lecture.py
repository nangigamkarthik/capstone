from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.core.constants import LectureStatus

class LectureBase(BaseModel):
    course_id: int
    room_id: int
    teacher_id: int
    title: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: LectureStatus = LectureStatus.SCHEDULED

class LectureCreate(LectureBase):
    pass

class LectureUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[LectureStatus] = None
    recording_url: Optional[str] = None
    metadata_json: Optional[dict] = None

class LectureResponse(LectureBase):
    id: int
    recording_url: Optional[str] = None
    metadata_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LectureListResponse(BaseModel):
    lectures: List[LectureResponse]
    total: int

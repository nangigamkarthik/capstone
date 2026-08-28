from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AttendanceBase(BaseModel):
    student_id: int
    lecture_id: int
    method: str = "face_recognition"
    confidence: Optional[float] = None

class AttendanceCreate(AttendanceBase):
    check_in_time: Optional[datetime] = None

class AttendanceResponse(AttendanceBase):
    id: int
    check_in_time: datetime
    check_out_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AttendanceReport(BaseModel):
    lecture_id: int
    lecture_title: str
    date: datetime
    total_enrolled: int
    total_present: int
    attendance_rate: float
    records: List[AttendanceResponse]

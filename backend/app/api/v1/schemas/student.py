from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    student_code: str
    full_name: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentListResponse(BaseModel):
    students: List[StudentResponse]
    total: int

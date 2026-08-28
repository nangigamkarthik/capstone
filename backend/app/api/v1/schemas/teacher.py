from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TeacherBase(BaseModel):
    employee_code: str
    full_name: str
    department: str

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None

class TeacherResponse(TeacherBase):
    id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeacherListResponse(BaseModel):
    teachers: List[TeacherResponse]
    total: int

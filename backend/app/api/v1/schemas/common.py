from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=1000)

class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    celery: str
    timestamp: datetime

class ErrorResponse(BaseModel):
    detail: str

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None

class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

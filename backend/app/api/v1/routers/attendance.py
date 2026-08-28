from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, UTC
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.course import Attendance, Lecture
from app.api.v1.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceReport
from app.api.v1.deps import require_role
from app.core.constants import UserRole

router = APIRouter()

@router.get("/", response_model=List[AttendanceResponse])
async def list_attendance(
    skip: int = 0,
    limit: int = 100,
    lecture_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    query = select(Attendance)
    if lecture_id:
        query = query.filter(Attendance.lecture_id == lecture_id)
        
    result = await db.execute(query.offset(skip).limit(limit))
    records = result.scalars().all()
    return [AttendanceResponse.model_validate(r) for r in records]

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance(
    attendance_in: AttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Check if duplicate
    existing = await db.execute(
        select(Attendance).filter(
            Attendance.student_id == attendance_in.student_id,
            Attendance.lecture_id == attendance_in.lecture_id
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Attendance record already exists")

    record = Attendance(
        student_id=attendance_in.student_id,
        lecture_id=attendance_in.lecture_id,
        check_in_time=attendance_in.check_in_time or datetime.now(UTC),
        method=attendance_in.method,
        confidence=attendance_in.confidence
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

@router.get("/report/{lecture_id}", response_model=AttendanceReport)
async def get_attendance_report(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Fetch lecture
    lecture_result = await db.execute(select(Lecture).filter(Lecture.id == lecture_id))
    lecture = lecture_result.scalars().first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    # Fetch attendance records
    records_result = await db.execute(select(Attendance).filter(Attendance.lecture_id == lecture_id))
    records = records_result.scalars().all()
    
    # In a full app, query total enrolled students for course. Let's mock totals:
    total_enrolled = 30
    total_present = len(records)
    rate = total_present / total_enrolled if total_enrolled > 0 else 0.0
    
    return AttendanceReport(
        lecture_id=lecture.id,
        lecture_title=lecture.title,
        date=lecture.start_time,
        total_enrolled=total_enrolled,
        total_present=total_present,
        attendance_rate=rate,
        records=[AttendanceResponse.model_validate(r) for r in records]
    )
from typing import Optional

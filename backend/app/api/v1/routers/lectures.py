from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from datetime import datetime, UTC
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.course import Lecture
from app.api.v1.schemas.lecture import LectureCreate, LectureUpdate, LectureResponse, LectureListResponse
from app.api.v1.deps import require_role
from app.core.constants import UserRole, LectureStatus

router = APIRouter()

@router.get("/", response_model=LectureListResponse)
async def list_lectures(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    query = select(Lecture)
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0
    
    result = await db.execute(query.offset(skip).limit(limit))
    lectures = result.scalars().all()
    return LectureListResponse(lectures=[LectureResponse.model_validate(l) for l in lectures], total=total)

@router.post("/", response_model=LectureResponse, status_code=status.HTTP_201_CREATED)
async def create_lecture(
    lecture_in: LectureCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    lecture = Lecture(**lecture_in.model_dump())
    db.add(lecture)
    await db.commit()
    await db.refresh(lecture)
    return lecture

@router.get("/{id}", response_model=LectureResponse)
async def get_lecture(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    result = await db.execute(select(Lecture).filter(Lecture.id == id))
    lecture = result.scalars().first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture

@router.put("/{id}", response_model=LectureResponse)
async def update_lecture(
    id: int,
    lecture_in: LectureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(select(Lecture).filter(Lecture.id == id))
    lecture = result.scalars().first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    update_data = lecture_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lecture, field, value)
        
    await db.commit()
    await db.refresh(lecture)
    return lecture

@router.post("/{id}/start", response_model=LectureResponse)
async def start_lecture(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(select(Lecture).filter(Lecture.id == id))
    lecture = result.scalars().first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    lecture.status = LectureStatus.ACTIVE
    lecture.start_time = datetime.now(UTC)
    await db.commit()
    await db.refresh(lecture)
    
    # Trigger background real-time stream loop (CV + scoring + broadcast)
    from app.infrastructure.websocket.streamer import start_lecture_stream
    await start_lecture_stream(lecture.id, lecture.room_id)
    
    return lecture

@router.post("/{id}/end", response_model=LectureResponse)
async def end_lecture(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(select(Lecture).filter(Lecture.id == id))
    lecture = result.scalars().first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
        
    lecture.status = LectureStatus.COMPLETED
    lecture.end_time = datetime.now(UTC)
    await db.commit()
    await db.refresh(lecture)
    
    # Stop the real-time stream loop
    from app.infrastructure.websocket.streamer import stop_lecture_stream
    await stop_lecture_stream(lecture.id)
    
    return lecture


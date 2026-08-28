from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.user import Teacher
from app.api.v1.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse, TeacherListResponse
from app.api.v1.deps import require_role
from app.core.constants import UserRole

router = APIRouter()

@router.get("/", response_model=TeacherListResponse)
async def list_teachers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    query = select(Teacher)
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0
    
    result = await db.execute(query.offset(skip).limit(limit))
    teachers = result.scalars().all()
    return TeacherListResponse(teachers=[TeacherResponse.model_validate(t) for t in teachers], total=total)

@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher_in: TeacherCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    existing = await db.execute(select(Teacher).filter(Teacher.employee_code == teacher_in.employee_code))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Employee code already registered")
        
    teacher = Teacher(
        employee_code=teacher_in.employee_code,
        full_name=teacher_in.full_name,
        department=teacher_in.department
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher

@router.get("/{id}", response_model=TeacherResponse)
async def get_teacher(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Teacher).filter(Teacher.id == id))
    teacher = result.scalars().first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{id}", response_model=TeacherResponse)
async def update_teacher(
    id: int,
    teacher_in: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Teacher).filter(Teacher.id == id))
    teacher = result.scalars().first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    if teacher_in.full_name is not None:
        teacher.full_name = teacher_in.full_name
    if teacher_in.department is not None:
        teacher.department = teacher_in.department
        
    await db.commit()
    await db.refresh(teacher)
    return teacher

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Teacher).filter(Teacher.id == id))
    teacher = result.scalars().first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await db.delete(teacher)
    await db.commit()
    return None

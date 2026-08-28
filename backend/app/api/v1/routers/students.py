from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.user import Student
from app.api.v1.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.api.v1.deps import require_role
from app.core.constants import UserRole

router = APIRouter()

@router.get("/", response_model=StudentListResponse)
async def list_students(
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    query = select(Student)
    if search:
        query = query.filter(Student.full_name.ilike(f"%{search}%"))
    
    # Count total
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0
    
    # Paginate
    result = await db.execute(query.offset(skip).limit(limit))
    students = result.scalars().all()
    
    return StudentListResponse(students=[StudentResponse.model_validate(s) for s in students], total=total)

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_in: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    # Check if student code exists
    existing = await db.execute(select(Student).filter(Student.student_code == student_in.student_code))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Student code already registered")
        
    student = Student(
        student_code=student_in.student_code,
        full_name=student_in.full_name
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student

@router.get("/{id}", response_model=StudentResponse)
async def get_student(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(select(Student).filter(Student.id == id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{id}", response_model=StudentResponse)
async def update_student(
    id: int,
    student_in: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Student).filter(Student.id == id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if student_in.full_name is not None:
        student.full_name = student_in.full_name
        
    await db.commit()
    await db.refresh(student)
    return student

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Student).filter(Student.id == id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.delete(student)
    await db.commit()
    return None

@router.post("/{id}/enroll-face")
async def enroll_face(
    id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(Student).filter(Student.id == id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Read image and save face embeddings
    contents = await file.read()
    # In a real environment, we'd run InsightFace extract_embedding(contents)
    # For now, we mock it by storing a dummy vector
    student.face_embedding = b"dummy_embedding_vector_data"
    await db.commit()
    return {"message": "Face enrolled successfully"}

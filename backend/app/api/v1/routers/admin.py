from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, UTC

from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.user import User, Student
from app.infrastructure.database.models.system import AuditLog, PrivacyConsent
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.v1.deps import require_role
from app.core.constants import UserRole

from app.core.audit import AuditLogger

router = APIRouter()

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    uname = form_data.username.strip().lower()
    result = await db.execute(
        select(User).filter(
            (func.lower(User.email) == uname) |
            (func.lower(User.email) == f"{uname}@cogniclass.ai") |
            (func.lower(User.email) == f"{uname}@classroom.edu") |
            (func.lower(User.role) == uname)
        )
    )
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token = create_access_token(subject=user.id)
    await AuditLogger.log_action(
        db=db,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
        details={"email": user.email, "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/users")
async def create_user(
    email: str,
    password: str,
    full_name: str,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    # Check duplicate
    existing = await db.execute(select(User).filter(User.email == email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    await AuditLogger.log_action(
        db=db,
        action="USER_CREATE",
        entity_type="user",
        entity_id=user.id,
        user_id=current_user.id,
        details={"created_email": email, "created_role": role}
    )
    return user

@router.get("/audit-logs")
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("/privacy/consent")
async def update_privacy_consent(
    student_id: int,
    consent_type: str,
    granted: bool,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER]))
):
    # Fetch student
    student_check = await db.execute(select(Student).filter(Student.id == student_id))
    if not student_check.scalars().first():
        raise HTTPException(status_code=404, detail="Student not found")
        
    consent = PrivacyConsent(
        student_id=student_id,
        consent_type=consent_type,
        granted=granted,
        granted_at=datetime.now(UTC) if granted else None,
        revoked_at=datetime.now(UTC) if not granted else None
    )
    db.add(consent)
    await db.commit()
    
    await AuditLogger.log_action(
        db=db,
        action="PRIVACY_CONSENT_UPDATE",
        entity_type="student",
        entity_id=student_id,
        user_id=current_user.id,
        details={"consent_type": consent_type, "granted": granted}
    )
    return {"message": "Consent updated successfully"}

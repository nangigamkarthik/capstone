from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, UTC
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.system import Report
from app.api.v1.deps import require_role
from app.core.constants import UserRole

router = APIRouter()

@router.get("/")
async def list_reports(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(
        select(Report)
        .order_by(Report.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reports = result.scalars().all()
    return reports

@router.post("/generate")
async def generate_report(
    report_type: str,
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    report = Report(
        report_type=report_type,
        title=f"Classroom Engagement Report - Lecture {lecture_id}",
        parameters_json={"lecture_id": lecture_id},
        status="pending"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # In a full app, we trigger a Celery task:
    # generate_report.delay(report.id)
    # For now, we mock completed status
    report.status = "completed"
    report.file_url = f"/downloads/report_{report.id}.pdf"
    report.generated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/{id}")
async def get_report(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(select(Report).filter(Report.id == id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, UTC
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.analytics import EngagementScore, EnvironmentMetrics, Prediction
from app.infrastructure.database.models.classroom_data import EmotionSnapshot
from app.infrastructure.database.models.system import Heatmap
from app.api.v1.schemas.analytics import DashboardStats, EnvironmentResponse, HeatmapResponse
from app.api.v1.schemas.engagement import EngagementResponse
from app.api.v1.schemas.emotion import EmotionResponse, ClassroomEmotionSummary
from app.api.v1.schemas.prediction import PredictionResponse, RiskStudentResponse
from app.api.v1.deps import require_role
from app.core.constants import UserRole, EmotionType

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Mocking dashboard stats
    return DashboardStats(
        total_students=156,
        active_classes=4,
        avg_engagement=73.2,
        avg_attention=68.5,
        attendance_rate=94.1,
        alert_count=7
    )

@router.get("/engagement/live/{lecture_id}", response_model=List[EngagementResponse])
async def get_live_engagement(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(
        select(EngagementScore)
        .filter(EngagementScore.lecture_id == lecture_id)
        .order_by(EngagementScore.timestamp.desc())
        .limit(30)
    )
    scores = result.scalars().all()
    return [EngagementResponse.model_validate(s) for s in scores]

@router.get("/engagement/student/{student_id}", response_model=List[EngagementResponse])
async def get_student_engagement(
    student_id: int,
    lecture_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    query = select(EngagementScore).filter(EngagementScore.student_id == student_id)
    if lecture_id:
        query = query.filter(EngagementScore.lecture_id == lecture_id)
    query = query.order_by(EngagementScore.timestamp.asc())
    
    result = await db.execute(query)
    scores = result.scalars().all()
    return [EngagementResponse.model_validate(s) for s in scores]

@router.get("/emotions/live/{lecture_id}", response_model=List[EmotionResponse])
async def get_live_emotions(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(
        select(EmotionSnapshot)
        .filter(EmotionSnapshot.lecture_id == lecture_id)
        .order_by(EmotionSnapshot.timestamp.desc())
        .limit(30)
    )
    snapshots = result.scalars().all()
    return [EmotionResponse.model_validate(s) for s in snapshots]

@router.get("/emotions/summary/{lecture_id}", response_model=ClassroomEmotionSummary)
async def get_classroom_emotion_summary(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Mocking aggregated emotions
    return ClassroomEmotionSummary(
        lecture_id=lecture_id,
        timestamp=datetime.now(UTC),
        dominant_emotion=EmotionType.NEUTRAL,
        distribution={
            EmotionType.HAPPY: 0.15,
            EmotionType.NEUTRAL: 0.60,
            EmotionType.CONFUSED: 0.10,
            EmotionType.INTERESTED: 0.08,
            EmotionType.BORED: 0.05,
            EmotionType.FRUSTRATED: 0.01,
            EmotionType.SURPRISED: 0.01
        }
    )

@router.get("/environment/{lecture_id}", response_model=List[EnvironmentResponse])
async def get_environment_metrics(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(
        select(EnvironmentMetrics)
        .filter(EnvironmentMetrics.lecture_id == lecture_id)
        .order_by(EnvironmentMetrics.timestamp.asc())
    )
    metrics = result.scalars().all()
    return [EnvironmentResponse.model_validate(m) for m in metrics]

@router.get("/predictions/student/{student_id}", response_model=List[PredictionResponse])
async def get_student_predictions(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    result = await db.execute(
        select(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.timestamp.desc())
    )
    predictions = result.scalars().all()
    return [PredictionResponse.model_validate(p) for p in predictions]

@router.get("/predictions/risk-students", response_model=List[RiskStudentResponse])
async def get_risk_students(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # Mock at-risk students for demo
    return [
        RiskStudentResponse(
            student_id=1,
            student_name="Alice Smith",
            risk_score=82.5,
            risk_factors=["Frequent lookaways", "Low interaction", "Sleeping detected twice"],
            predicted_grade_drop=-1.2
        ),
        RiskStudentResponse(
            student_id=5,
            student_name="Bob Jones",
            risk_score=75.0,
            risk_factors=["Phone usage detected", "Distraction spikes"],
            predicted_grade_drop=-0.8
        )
    ]

@router.get("/heatmaps/{lecture_id}", response_model=List[HeatmapResponse])
async def get_heatmaps(
    lecture_id: int,
    heatmap_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    query = select(Heatmap).filter(Heatmap.lecture_id == lecture_id)
    if heatmap_type:
        query = query.filter(Heatmap.heatmap_type == heatmap_type)
        
    result = await db.execute(query.order_by(Heatmap.timestamp.desc()))
    heatmaps = result.scalars().all()
    return [HeatmapResponse.model_validate(h) for h in heatmaps]

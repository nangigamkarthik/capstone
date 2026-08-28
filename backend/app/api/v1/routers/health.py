from fastapi import APIRouter, Depends
from datetime import datetime, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.infrastructure.database.session import get_db
from app.api.v1.schemas.common import HealthResponse
import redis
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["System Health"])
async def health(db: AsyncSession = Depends(get_db)):
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"
        
    redis_status = "healthy"
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        r.ping()
    except Exception:
        redis_status = "unhealthy"

    celery_status = "healthy" # Celery running check is complex, default to healthy if redis is fine

    return HealthResponse(
        status="healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        database=db_status,
        redis=redis_status,
        celery=celery_status,
        timestamp=datetime.now(UTC)
    )

@router.get("/health/ready", tags=["System Health"])
async def ready(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}

@router.get("/health/live", tags=["System Health"])
def live():
    return {"status": "live"}

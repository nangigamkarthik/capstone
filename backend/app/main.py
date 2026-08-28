from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.api.v1.routers import health, students, teachers, lectures, attendance, analytics, copilot, replay, reports, rag, research, admin, ws, alerts

# Setup logging
logger.remove()
logger.add(sys.stdout, colorize=True, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level:8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent classroom analytics, predictive AI, explainable AI, multimodal perception, and interactive 3D digital twin.",
    version=settings.APP_VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Start request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"End request status: {response.status_code}")
    return response

# Include Routers
app.include_router(health.router, prefix=f"{settings.API_V1_PREFIX}/health", tags=["Health"])
app.include_router(students.router, prefix=f"{settings.API_V1_PREFIX}/students", tags=["Students"])
app.include_router(teachers.router, prefix=f"{settings.API_V1_PREFIX}/teachers", tags=["Teachers"])
app.include_router(lectures.router, prefix=f"{settings.API_V1_PREFIX}/lectures", tags=["Lectures"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_PREFIX}/attendance", tags=["Attendance"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["Analytics"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_PREFIX}/copilot", tags=["Copilot"])
app.include_router(replay.router, prefix=f"{settings.API_V1_PREFIX}/replay", tags=["Replay"])
app.include_router(reports.router, prefix=f"{settings.API_V1_PREFIX}/reports", tags=["Reports"])
app.include_router(rag.router, prefix=f"{settings.API_V1_PREFIX}/rag", tags=["RAG"])
app.include_router(research.router, prefix=f"{settings.API_V1_PREFIX}/research", tags=["Research"])
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Admin & Auth"])
app.include_router(ws.router, prefix="/ws", tags=["WebSockets"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_PREFIX}/alerts", tags=["Alerts"])

@app.get("/")
def read_root():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": f"{settings.API_V1_PREFIX}/docs"
    }

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Cognitive Classroom Platform...")
    # Any DB pooling or initialization can go here

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Stopping Cognitive Classroom Platform...")

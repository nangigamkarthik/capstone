from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, UTC
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.analytics import CopilotSuggestion
from app.infrastructure.database.models.speech_and_knowledge import Transcript, LectureSummary
from app.api.v1.schemas.copilot import CopilotSuggestionResponse, CopilotChatRequest, CopilotChatResponse
from app.api.v1.schemas.transcript import TranscriptResponse, LectureSummaryResponse
from app.api.v1.deps import require_role
from app.core.constants import UserRole

router = APIRouter()

@router.get("/suggestions/{lecture_id}", response_model=List[CopilotSuggestionResponse])
async def get_copilot_suggestions(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    result = await db.execute(
        select(CopilotSuggestion)
        .filter(CopilotSuggestion.lecture_id == lecture_id)
        .order_by(CopilotSuggestion.timestamp.desc())
    )
    suggestions = result.scalars().all()
    return [CopilotSuggestionResponse.model_validate(s) for s in suggestions]

@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    payload: CopilotChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    # In a full app, we'd query settings.LLM_PROVIDER with LangChain/RAG
    # For now, we mock the AI copilot response
    reply = f"Based on the classroom metrics, engagement has dropped by 12% in the back rows. I suggest moving closer to rows 4-5 and asking a direct question to stimulate participation."
    
    # Return mock reply with recent suggestions
    suggestions = []
    if payload.lecture_id:
        result = await db.execute(
            select(CopilotSuggestion)
            .filter(CopilotSuggestion.lecture_id == payload.lecture_id)
            .limit(3)
        )
        suggestions = [CopilotSuggestionResponse.model_validate(s) for s in result.scalars().all()]
        
    return CopilotChatResponse(reply=reply, suggestions=suggestions)

@router.get("/transcripts/{lecture_id}", response_model=List[TranscriptResponse])
async def get_lecture_transcript(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    result = await db.execute(
        select(Transcript)
        .filter(Transcript.lecture_id == lecture_id)
        .order_by(Transcript.start_time.asc())
    )
    transcripts = result.scalars().all()
    # Maps Transcript model to TranscriptResponse list (mock response structure)
    return []

@router.get("/transcripts/{lecture_id}/summary", response_model=LectureSummaryResponse)
async def get_lecture_summary(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT]))
):
    result = await db.execute(
        select(LectureSummary)
        .filter(LectureSummary.lecture_id == lecture_id)
    )
    summary = result.scalars().first()
    if not summary:
        raise HTTPException(status_code=404, detail="Lecture summary not generated yet")
    return summary

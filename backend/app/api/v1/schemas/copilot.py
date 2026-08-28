from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CopilotSuggestionResponse(BaseModel):
    id: int
    lecture_id: int
    timestamp: datetime
    suggestion_text: str
    reasoning: str
    priority: str
    category: str
    acted_upon: bool

    model_config = ConfigDict(from_attributes=True)

class CopilotChatRequest(BaseModel):
    message: str
    lecture_id: Optional[int] = None
    context_window: Optional[int] = 5 # minutes

class CopilotChatResponse(BaseModel):
    reply: str
    suggestions: list[CopilotSuggestionResponse]

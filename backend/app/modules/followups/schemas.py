from typing import Optional

from pydantic import BaseModel, Field

from app.modules.analyses.schemas import LanguageHint
from app.schemas.ai_response import AIResponse


class FollowupRequest(BaseModel):
    error_text: str = Field(..., min_length=1)
    context: Optional[str] = None
    language_hint: LanguageHint = "auto"
    previous_response: AIResponse
    question: str = Field(..., min_length=1)
    analysis_id: Optional[str] = None

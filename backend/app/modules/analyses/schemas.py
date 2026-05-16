from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

LanguageHint = Literal["auto", "python", "javascript", "java"]


class AnalyzeRequest(BaseModel):
    error_text: str = Field(..., min_length=1)
    context: Optional[str] = None
    language_hint: LanguageHint = "auto"


class PersistedAnalysisResponse(BaseModel):
    id: str
    title: str
    error_text: str
    context: str | None
    language_hint: str | None
    language_detected: str
    summary: str
    likely_cause: str
    fix_steps: list[str]
    debug_steps: list[str]
    assumptions: list[str]
    followup_questions: list[str]
    confidence: float
    is_favorite: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
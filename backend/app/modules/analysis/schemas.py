from typing import Literal, Optional

from pydantic import BaseModel, Field

LanguageHint = Literal["auto", "python", "javascript", "java"]


class AnalyzeRequest(BaseModel):
    error_text: str = Field(..., min_length=1)
    context: Optional[str] = None
    language_hint: LanguageHint = "auto"
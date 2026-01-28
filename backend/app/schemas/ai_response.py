from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class SupportedLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    UNKNOWN = "unknown"


class AIResponse(BaseModel):
    """
    Contract for the structured AI response that the analyzer expects.

    This schema is used for:
    - Validating LLM JSON output on the backend
    - Defining the API response shape for the frontend
    """

    language_detected: SupportedLanguage = Field(
        description="Programming language inferrred from error and/or code snippet.",
    )

    summary: str = Field(
        description="Short, high-level explanation of what the error means in simple terms.",
    )

    likely_cause: str = Field(
        description="Most likey root cause of the error, in one or a few sentences.",
    )

    fix_steps: List[str] = Field(
        default_factory=list,
        description="Concrete steps the user should take to fix the error.",
    )

    debug_steps: List[str] = Field(
        default_factory=list,
        description="Steps to further investigate the issue (logging, checks, reproductions).",
    )

    assumptions: List[str] = Field(
        default_factory=list,
        description="Assumptions the AI made when reasoning about the error",
    )

    followup_questions: List[str] = Field(
        default_factory=list,
        description="Questions the AI would ask the user to gather more context.",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0-1.0) for the overall analysis.",
    )

    class config:
        """Model configuration."""

        # Ensure we always get JSON-friendly types
        populate_by_name = True

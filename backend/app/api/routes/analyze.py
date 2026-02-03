from typing import Literal, Optional
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.schemas.ai_response import AIResponse, SupportedLanguage
from app.services.analysis.normalize import normalize_error_text
from app.services.analysis.detect_language import detect_language
from app.services.ai.client import AIClient
from app.services.ai.errors import (
    AINetworkError,
    AIProviderError,
    AIResponseParseError,
    AIResponseValidationError,
    AIConfigurationError,
    AIClientError,
)
from app.services.ai.prompts.registry import PromptVersion, get_prompt_template


router = APIRouter(tags=["analysis"])


# Request Model
LanguageHint = Literal["auto", "python", "javascript", "java"]


class AnalyzeRequest(BaseModel):
    error_text: str = Field(..., min_length=1)
    context: Optional[str] = None
    language_hint: LanguageHint = "auto"


# Dependency: AI client lifecycle
async def get_ai_client() -> AsyncGenerator[AIClient, None]:
    """
    Create per-request AIClient instance.
    Ensures httpx.AsyncClient is properly closed.
    """
    client = AIClient()
    try:
        yield client
    finally:
        await client.aclose()


# Utility: Convert string hint → SupportedLanguage
def _resolve_language_hint(
    hint: LanguageHint | None,
) -> Optional[SupportedLanguage]:
    """
    Convert the optional user-provided language hint
    into a SupportedLanguage enum (unless hint=auto).
    """
    if hint is None or hint == "auto":
        return None

    mapping = {
        "python": SupportedLanguage.PYTHON,
        "javascript": SupportedLanguage.JAVASCRIPT,
        "java": SupportedLanguage.JAVA,
    }
    return mapping.get(hint.lower())


# Utility: Render final prompt from template
def _render_prompt(
    *,
    language_hint: Optional[SupportedLanguage],
    detected_language: SupportedLanguage,
    normalized_error_text: str,
    context: Optional[str],
) -> str:
    """
    Load the correct prompt template (based on detected language + version)
    and format it with runtime values.

    - error_message := normalized text after scrubbing
    - code_snippet := additional context provided by the client
    - stacktrace   := (future: may extract separately)
    """

    version = PromptVersion.V1

    # Load template from disk
    prompt_template = get_prompt_template(
        language=detected_language,
        version=version,
    )

    template_data = {
        "language_hint": (
            language_hint.value if language_hint is not None else "unknown"
        ),
        "error_message": normalized_error_text,
        "code_snippet": context or "",
        "stacktrace": normalized_error_text,
    }

    try:
        return prompt_template.format(**template_data)
    except KeyError as exc:
        raise RuntimeError(
            f"Prompt template formatting failed: missing placeholder {exc}"
        ) from exc


# POST /api/analyze
@router.post(
    "/analyze",
    response_model=AIResponse,
    summary="Analyze an error message and return structured JSON from AI.",
)
async def analyze_error(
    payload: AnalyzeRequest,
    ai_client: AIClient = Depends(get_ai_client),
) -> AIResponse:
    """
    Main pipeline for analyzing errors.

    Steps:
    1) Validate request (FastAPI/Pydantic)
    2) Normalize text (scrubbing + trimming)
    3) Convert language_hint → enum
    4) Detect language using heuristics
    5) Render prompt template
    6) Call AI provider through AIClient
    7) Validate returned JSON against AIResponse schema
    """

    # 1) Normalize text
    normalized_text = normalize_error_text(payload.error_text)

    # 2) Optional language hint
    hint_enum = _resolve_language_hint(payload.language_hint)

    # 3) Detect language from input + hint
    detected_language = detect_language(
        normalized_text,
        language_hint=hint_enum,
    )

    # 4) Render prompt using templates
    prompt = _render_prompt(
        language_hint=hint_enum,
        detected_language=detected_language,
        normalized_error_text=normalized_text,
        context=payload.context,
    )

    # 5) Call AI provider
    try:
        ai_response = await ai_client.generate_response(
            prompt=prompt,
            language=detected_language,
            version=PromptVersion.V1,
        )
        return ai_response

    # Configuration errors
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI provider is not properly configured.",
        ) from exc

    # Provider/network errors
    except (AINetworkError, AIProviderError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach AI provider.",
        ) from exc

    # AI returned invalid JSON / schema mismatch
    except (AIResponseParseError, AIResponseValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an invalid or malformed response.",
        ) from exc

    # Unexpected AIClient issues
    except AIClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected AI client failure.",
        ) from exc

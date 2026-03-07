from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.routes.analyze import (
    LanguageHint,
    _render_prompt,
    _resolve_language_hint,
    get_ai_client,
)
from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient
from app.services.ai.errors import (
    AIClientError,
    AIConfigurationError,
    AINetworkError,
    AIProviderError,
    AIResponseParseError,
    AIResponseValidationError,
)
from app.services.analysis.detect_language import detect_language
from app.services.analysis.normalize import normalize_error_text

router = APIRouter(tags=["followup"])


# ---- Request models ----


class FollowupRequest(BaseModel):
    """
    Stateless follow-up request.

    The client sends:
      - Original error context
      - The previous AIResponse
      - A new follow-up question
      - (Optional) analysis_id for future stateful versions
    """

    error_text: str = Field(..., min_length=1)
    context: Optional[str] = None
    language_hint: LanguageHint = "auto"

    previous_response: AIResponse

    question: str = Field(..., min_length=1)
    analysis_id: Optional[str] = None  # reserved for future stateful threads


# ---- Endpoint ----


@router.post(
    "/followup",
    response_model=AIResponse,
    summary="Ask a follow-up question about a previous error analysis.",
)
async def followup_analysis(
    payload: FollowupRequest,
    ai_client: AIClient = Depends(get_ai_client),
) -> AIResponse:
    """
    Follow-up endpoint (MVP, stateless):

    1) Normalize the original error text.
    2) Resolve language_hint -> SupportedLanguage | None.
    3) Detect language from text (+ hint).
    4) Render the base prompt (same templates as /api/analyze).
    5) Append FOLLOW-UP block with previous_response + user question.
    6) Call AIClient and return a fresh AIResponse.
    """

    normalize_text = normalize_error_text(payload.error_text)

    hint_enum = _resolve_language_hint(payload.language_hint)

    detected_language = detect_language(
        normalize_text,
        language_hint=hint_enum,
    )

    base_prompt = _render_prompt(
        language_hint=hint_enum,
        detected_language=detected_language,
        normalized_error_text=normalize_text,
        context=payload.context,
    )

    previous_json = payload.previous_response.model_dump_json(indent=2)

    followup_block = f"""
---

FOLLOW-UP CONTEXT
You previously analyzed this error and returned the following JSON:

{previous_json}

The user is now asking this follow-up question about the same error/context:

FOLLOW_UP_QUESTION:
{payload.question}

Your task:
- Update or extend your analysis based on this follow-up question.
- You may adjust any fields (summary, likely_cause, fix_steps, debug_steps,
  assumptions, followup_questions, confidence) to better answer the follow-up.
- Keep language_detected consistent with the detected language unless there is
  a strong reason to change it.

IMPORTANT OUTPUT REQUIREMENTS:
- You MUST respond with a SINGLE JSON object.
- The JSON MUST match EXACTLY this schema:
  {{
    "language_detected": "<one of: python, javascript, java, unknown>",
    "summary": "<short explanation>",
    "likely_cause": "<most likely root cause>",
    "fix_steps": ["<step 1>", "<step 2>", ...],
    "debug_steps": ["<step 1>", "<step 2>", ...],
    "assumptions": ["<assumption 1>", "<assumption 2>", ...],
    "followup_questions": ["<question 1>", "<question 2>", ...],
    "confidence": 0.0
  }}
- Do NOT include any text outside the JSON.
"""

    prompt = base_prompt + followup_block

    try:
        ai_response = await ai_client.generate_response(
            prompt=prompt,
            language=detected_language,
            version=None,
        )
        return ai_response

    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI provider is not properly configured.",
        ) from exc

    except (AINetworkError, AIProviderError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach AI provider.",
        ) from exc

    except (AIResponseParseError, AIResponseValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an invalid or malformed response.",
        ) from exc

    except AIClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected AI client failure.",
        ) from exc

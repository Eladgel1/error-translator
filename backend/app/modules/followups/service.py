from app.modules.analyses.prompting import render_analysis_prompt
from app.modules.analyses.service import resolve_language_hint
from app.modules.followups.schemas import FollowupRequest
from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient
from app.services.analysis.detect_language import detect_language
from app.services.analysis.normalize import normalize_error_text


async def followup_analysis_message(
    *,
    payload: FollowupRequest,
    ai_client: AIClient,    
) -> AIResponse:
    """
    Stateless follow-up pipeline.
    """

    normalized_text = normalize_error_text(payload.error_text)

    hint_enum = resolve_language_hint(payload.language_hint)

    detected_language = detect_language(
        normalized_text,
        language_hint=hint_enum,
    )

    base_prompt = render_analysis_prompt(
        language_hint=hint_enum,
        detected_language=detected_language,
        normalized_error_text=normalized_text,
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
- You may adjust any fields to better answer the follow-up.
- Keep language_detected consistent with the detected language unless there is
  a strong reason to change it.

IMPORTANT OUTPUT REQUIREMENTS:
- You MUST respond with a SINGLE JSON object.
- The JSON MUST match the existing AIResponse schema.
- Do NOT include any text outside the JSON.
"""
    prompt = base_prompt + followup_block

    return await ai_client.generate_response(
        prompt=prompt,
        language=detected_language,
        version=None,
    )
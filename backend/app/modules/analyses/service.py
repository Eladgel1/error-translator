from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.user import User
from app.modules.analyses.prompting import render_analysis_prompt
from app.modules.analyses.repository import create_analysis_record
from app.modules.analyses.schemas import AnalyzeRequest, LanguageHint
from app.schemas.ai_response import AIResponse, SupportedLanguage
from app.services.ai.client import AIClient
from app.services.ai.prompts.registry import PromptVersion
from app.services.analysis.detect_language import detect_language
from app.services.analysis.normalize import normalize_error_text


def resolve_language_hint(
    hint: LanguageHint | None,
) -> Optional[SupportedLanguage]:
    """
    Convert the user-provided language hint into SupportedLanguage.
    """
    if hint is None or hint == "auto":
        return None

    mapping = {
        "python": SupportedLanguage.PYTHON,
        "javascript": SupportedLanguage.JAVASCRIPT,
        "java": SupportedLanguage.JAVA,
    }

    return mapping.get(hint.lower())


def build_analysis_title(error_text: str) -> str:
    """
    Build a short display title from the first line of the submitted error.
    """

    lines = error_text.strip().splitlines()

    if not lines:
        return "Untitled analysis"

    first_line = lines[0].strip()

    return first_line[:80] if first_line else "Untitled analysis"


async def analyze_error_message(
    *,
    payload: AnalyzeRequest,
    ai_client: AIClient,
) -> AIResponse:
    """
    Main analysis pipeline.

    1. Normalize error text.
    2. Resolve optional language hint.
    3. Detect language.
    4. Render prompt.
    5. Call AI provider.
    6. Return validated AIResponse.
    """

    normalized_text = normalize_error_text(payload.error_text)

    hint_enum = resolve_language_hint(payload.language_hint)

    detected_language = detect_language(
        normalized_text,
        language_hint=hint_enum,
    )

    prompt = render_analysis_prompt(
        language_hint=hint_enum,
        detected_language=detected_language,
        normalized_error_text=normalized_text,
        context=payload.context,
    )

    return await ai_client.generate_response(
        prompt=prompt,
        language=detected_language,
        version=PromptVersion.V1,
    )


async def analyze_and_persist_error_message(
    *,
    payload: AnalyzeRequest,
    ai_client: AIClient,
    db: AsyncSession,
    current_user: User,
) -> Analysis:
    """
    Analyze an error message and persist the result for the authenticated user.

    This keeps the original stateless analyze flow reusable while adding
    database persistence for the new SaaS-style history feature.
    """

    ai_response = await analyze_error_message(
        payload=payload,
        ai_client=ai_client,
    )

    return await create_analysis_record(
        db,
        user_id=current_user.id,
        title=build_analysis_title(payload.error_text),
        error_text=payload.error_text,
        context=payload.context,
        language_hint=payload.language_hint,
        ai_response=ai_response,
    )
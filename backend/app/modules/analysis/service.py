from typing import Optional

from app.modules.analysis.prompting import render_analysis_prompt
from app.modules.analysis.schemas import AnalyzeRequest, LanguageHint
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
    6. Return validation AIResponse.
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
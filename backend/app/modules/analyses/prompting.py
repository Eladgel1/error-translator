from typing import Optional

from app.schemas.ai_response import SupportedLanguage
from app.services.ai.prompts.registry import PromptVersion, get_prompt_template


def render_analysis_prompt(
    *,
    language_hint: Optional[SupportedLanguage],
    detected_language: SupportedLanguage,
    normalized_error_text: str,
    context: Optional[str],    
) -> str:
    """
    Render the final AI prompt from the selected prompt template.
    """

    version = PromptVersion.V1

    prompt_template = get_prompt_template(
        language=detected_language,
        version=version,
    )

    template_data = {
        "language_hint": language_hint.value if language_hint is not None else "unknown",
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
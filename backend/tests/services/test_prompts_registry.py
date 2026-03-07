from app.schemas.ai_response import SupportedLanguage
from app.services.ai.prompts.registry import (
    PromptVersion,
    get_prompt_template,
)


def test_get_prompt_template_python_v1():
    template = get_prompt_template(SupportedLanguage.PYTHON, PromptVersion.V1)

    assert "{error_message}" in template
    assert "{code_snippet}" in template
    assert "You are an experienced Python developer" in template


def test_get_prompt_template_generic_for_unknown_language():
    template = get_prompt_template(SupportedLanguage.UNKNOWN, PromptVersion.V1)

    assert "You are an assistant that helps junior developers" in template
    assert "{error_message}" in template
    assert "{stacktrace}" in template


def test_all_languages_have_v1_prompt():
    for lang in SupportedLanguage:
        template = get_prompt_template(lang, PromptVersion.V1)
        assert template.strip() != ""

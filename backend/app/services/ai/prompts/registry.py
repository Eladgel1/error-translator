from enum import Enum
from functools import lru_cache
from pathlib import Path
import re
from sys import version
from typing import Dict

from app.schemas.ai_response import SupportedLanguage


class PromptVersion(str, Enum):
    V1 = "v1"


# Map each language to its v1 template filename
V1_PROMPT_FILES: Dict[SupportedLanguage, str] = {
    SupportedLanguage.PYTHON: "python.txt",
    SupportedLanguage.JAVASCRIPT: "javascript.txt",
    SupportedLanguage.JAVA: "java.txt",
    SupportedLanguage.UNKNOWN: "generic.txt",
}

# Directory of this file
_PROMPTS_DIR = Path(__file__).resolve().parent


@lru_cache(maxsize=None)
def _load_prompt_from_disk(version: PromptVersion, language: SupportedLanguage) -> str:
    """
    Load the prompt template for the given version and language from disk.
    The result is cached in memory for subsequent calls.
    """

    if version is not PromptVersion.V1:
        raise FileNotFoundError(f"Unsupported prompt version: {version}")
    
    filename = V1_PROMPT_FILES.get(language, "generic.txt")
    template_path = _PROMPTS_DIR / version.value / filename

    if not template_path.is_file():
        raise FileNotFoundError(f"Prompt template not found: {template_path}")
    
    return template_path.read_text(encoding="utf-8")


def get_prompt_template(
    language: SupportedLanguage,
    version: PromptVersion = PromptVersion.V1,
) -> str:
    
    """
    Return the raw prompt template for the given language and version.
    """

    return _load_prompt_from_disk(version, language)
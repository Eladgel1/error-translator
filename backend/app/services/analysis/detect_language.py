import re
from typing import Dict

from app.schemas.ai_response import SupportedLanguage

# ---- Regex patterns per language ----

# Python: classic traceback, .py files, Python-specific exception names
PYTHON_PATTERNS = [
    re.compile(r"Traceback \(most recent call last\):", re.IGNORECASE),
    re.compile(r'File ".*\.py"', re.IGNORECASE),
    re.compile(r"\.py[:\s]", re.IGNORECASE),
    re.compile(r"\bModuleNotFoundError\b"),
    re.compile(r"\bIndentationError\b"),
    re.compile(r"\bpytest\b"),
    re.compile(r"\bpython\b"),
]

# JavaScript: Node/JS stack frames, .js/.ts, JS error types
JAVASCRIPT_PATTERNS = [
    # Node-style stack: "at function (file.js:10:5)"
    re.compile(r"^\s*at .*\(.+\.jsx?:\d+:\d+\)", re.MULTILINE),
    # Node-style stack without function name: "at file.js:10:5"
    re.compile(r"^\s*at .+\.jsx?:\d+:\d+", re.MULTILINE),
    re.compile(r"\.jsx?[:\s]", re.IGNORECASE),
    re.compile(r"\.tsx?[:\s]", re.IGNORECASE),
    re.compile(r"\bTypeError:\b.*", re.IGNORECASE),
    re.compile(r"\bReferenceError:\b.*", re.IGNORECASE),
    re.compile(r"\bSyntaxError:\b.*", re.IGNORECASE),
    re.compile(r"\bnode:(internal|events|timers)", re.IGNORECASE),
    re.compile(r"\bnode\b", re.IGNORECASE),
]

# Java: classic stack trace lines, java.lang.* exceptions, "Exception in thread"
JAVA_PATTERNS = [
    re.compile(r'^Exception in thread ".+"', re.MULTILINE),
    re.compile(r"\bjava\.lang\.[A-Za-z]+\b"),
    re.compile(r"\bCaused by:\s+java\.[A-Za-z0-9_.]+\b"),
    re.compile(r"^\s*at .*\(.+\.java:\d+\)", re.MULTILINE),
    re.compile(r"\.java[:\s]", re.IGNORECASE),
    re.compile(r"\bNullPointerException\b"),
    re.compile(r"\bIllegalArgumentException\b"),
]


def _count_matches(text: str, patterns: list[re.Pattern[str]]) -> int:
    """Count total regex matches for a list of patterns."""
    score = 0
    for pattern in patterns:
        score += len(pattern.findall(text))
    return score


def _score_languages_(text: str) -> Dict[SupportedLanguage, int]:
    """Return a score per language based on rexeg matches"""
    scores: Dict[SupportedLanguage, int] = {
        SupportedLanguage.PYTHON: _count_matches(text, PYTHON_PATTERNS),
        SupportedLanguage.JAVASCRIPT: _count_matches(text, JAVASCRIPT_PATTERNS),
        SupportedLanguage.JAVA: _count_matches(text, JAVA_PATTERNS),
    }
    return scores


def detect_language(
    error_text: str,
    language_hint: SupportedLanguage | None = None,
) -> SupportedLanguage:
    """
    Detect the most likely language od the error text.
    """
    if language_hint is not None and language_hint is not SupportedLanguage.UNKNOWN:
        return language_hint

    if not error_text or not error_text.strip():
        return SupportedLanguage.UNKNOWN

    text = error_text

    scores = _score_languages_(text)
    best_lang, best_score = max(scores.items(), key=lambda item: item[1])

    if best_score <= 0:
        return SupportedLanguage.UNKNOWN

    return best_lang

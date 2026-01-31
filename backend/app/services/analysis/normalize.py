from __future__ import annotations

import re
from typing import Iterable

MAX_LINES_DEFAULT = 200
HEAD_LINES = 80
TAIL_LINES = 40


def normalize_error_text(
    raw: str,
    max_lines: int = MAX_LINES_DEFAULT,
) -> str:
    """
    High-level normalization + privacy scrubbing for error text.

    Steps:
    - Normalize line endings and strip leading/trailing whitespace.
    - Split into lines.
    - Remove obvious duplicates and empty noise.
    - Scrub sensitive data (paths, emails, tokens).
    - Truncate overly long traces (keep head and tail).
    - Join back into a clean string.
    """

    if not raw:
        return ""

    text = _normalize_line_endings(raw)
    lines = text.split("\n")

    lines = _strip_whitespace(lines)
    lines = _drop_empty_leading_trailing(lines)
    lines = _deduplicate_consecutive(lines)
    lines = _scrub_sensitive_data(lines)
    lines = _truncate_long_trace(lines, max_lines=max_lines)

    return "\n".join(lines)


# ---- Line-level helpers
def _normalize_line_endings(text: str) -> str:
    """Convert CRLF to LF and strip trailing whitespace."""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def _strip_whitespace(lines: Iterable[str]) -> list[str]:
    """Strip trailing spaces; keep leading spaces."""
    return [line.strip() for line in lines]


def _drop_empty_leading_trailing(lines: list[str]) -> list[str]:
    """Drop empty lines at the beginning and end."""
    start = 0
    end = len(lines)

    while start < end and lines[start] == "":
        start += 1

    while end > start and lines[end - 1] == "":
        end -= 1

    return lines[start:end]


def _deduplicate_consecutive(lines: list[str]) -> list[str]:
    """
    Collapse blocks of identical consecutive lines into a single line.

    This helps when repeated warnings or identical frames appear.
    """
    if not lines:
        return []

    result: list[str] = []
    previous = None

    for line in lines:
        if line == previous:
            continue
        result.append(line)
        previous = line

    return result


# ---- Privacy scrubbing ----

# Examples:
#   C:\Users\john\projects\app\file.py
#   /home/john/app/main.py
#   /Users/john/app/main.py

WINDOWS_USER_PATH_RE = re.compile(
    r"""C:\\Users\\[^\\\s]+[^\s]*""",
    flags=re.IGNORECASE,
)

UNIX_USER_PATH_RE = re.compile(
    r"""(/home|/Users)/[^/\s]+[^\s]*""",
)

EMAIL_RE = re.compile(r"""[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}""")

# Generic "secret-like" token: long, no spaces, contains letters/digits/_/-
SECRET_LIKE_RE = re.compile(
    r"(sk_(live|test)_[A-Za-z0-9]+)|(?<![A-Za-z0-9_\-])([A-Za-z0-9_\-]{24,})(?![A-Za-z0-9_\-])",
    flags=re.IGNORECASE,
)


def _scrub_sensitive_data(lines: list[str]) -> list[str]:
    """Apply privacy scrubbing rules line by line."""
    result: list[str] = []

    for line in lines:
        scrubbed = line

        # Paths
        scrubbed = WINDOWS_USER_PATH_RE.sub("<REDACTED_PATH>", scrubbed)
        scrubbed = UNIX_USER_PATH_RE.sub("<REDACTED_PATH>", scrubbed)

        # Emails
        scrubbed = EMAIL_RE.sub("<REDACTED_EMAIL>", scrubbed)

        # Secret-like tokens (API keys, access tokens, etc.)
        scrubbed = SECRET_LIKE_RE.sub("<REDACTED_SECRET>", scrubbed)

        result.append(scrubbed)

    return result


# ---- Truncation ----
def _truncate_long_trace(
    lines: list[str],
    max_lines: int = MAX_LINES_DEFAULT,
) -> list[str]:
    """
    Truncate long traces so that the output NEVER exceeds max_lines.
    Keeps a head+tail window and inserts a truncation marker in the middle.
    """

    if len(lines) <= max_lines:
        return lines

    # Always one marker line
    marker_lines = 1
    remaining = max_lines - marker_lines

    # Try to use configured head/tail defaults,
    # but if they do not fit in 'remaining', we scale them dynamically.
    head = lines[:HEAD_LINES]
    tail = lines[-TAIL_LINES:]

    # If head + tail too big → resize dynamically
    if len(head) + len(tail) > remaining:
        # Split the remaining lines evenly
        new_head_count = remaining // 2
        new_tail_count = remaining - new_head_count

        head = lines[:new_head_count]
        tail = lines[-new_tail_count:]

    skipped = len(lines) - len(head) - len(tail)
    marker = f"...[truncated {skipped} lines for brevity]..."

    return head + [marker] + tail

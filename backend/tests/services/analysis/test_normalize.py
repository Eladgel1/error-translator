import textwrap

from app.services.analysis.normalize import (
    _truncate_long_trace,
    normalize_error_text,
)

# ------------------------
# Basic scrubbing behaviour
# ------------------------


def test_scrub_paths_emails_and_secrets():
    raw = textwrap.dedent(
        r"""
        Traceback (most recent call last):
          File "C:\Users\john\projects\app\main.py", line 10, in <module>
            run()
          File "/home/john/app/service.py", line 42, in run
            raise ValueError("boom")

        Contact: john.doe@example.com
        API key: sk_dummy_key_for_tests_only_123456
        """
    ).strip()

    normalized = normalize_error_text(raw)

    # No usernames
    assert "john" not in normalized

    # Path redaction
    assert "<REDACTED_PATH>" in normalized

    # Email redaction
    assert "<REDACTED_EMAIL>" in normalized

    # Secrets redaction
    assert "<REDACTED_SECRET>" in normalized


# ------------------------
# Truncation
# ------------------------


def test_truncation_adds_marker():
    lines = [f"line {i}" for i in range(300)]
    truncated = _truncate_long_trace(lines, max_lines=100)

    assert len(truncated) <= 100
    assert any("truncated" in line for line in truncated)


def test_truncation_balances_head_and_tail():
    lines = [f"line {i}" for i in range(1000)]
    max_lines = 80

    truncated = _truncate_long_trace(lines, max_lines=max_lines)

    # Output size correct
    assert len(truncated) == max_lines

    # Still keeps first line
    assert truncated[0] == "line 0"

    # Has marker somewhere in the output
    assert any("truncated" in line for line in truncated)

    # Still keeps last line
    assert truncated[-1].startswith("line")


# ------------------------
# Normalization combined behaviour
# ------------------------


def test_normalize_combines_all_steps():
    raw = textwrap.dedent(
        """
        ValueError: Something broke
        File "/Users/eladg/myproject/app.py", line 42
        api_key = 'sk_live_abcdef123456789'
        john.doe@example.com
        """
    ).strip()

    out = normalize_error_text(raw)

    assert "<REDACTED_PATH>" in out
    assert "<REDACTED_SECRET>" in out
    assert "<REDACTED_EMAIL>" in out
    assert "john" not in out

import pytest

from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient
from app.services.ai.errors import (
    AIResponseParseError,
    AIResponseValidationError,
)


def test_parse_ai_response_valid_json():
    raw = """
    {
      "language_detected": "python",
      "summary": "You are calling a method on a None value.",
      "likely_cause": "The variable 'user' was never assigned.",
      "fix_steps": [
        "Check where 'user' is created.",
        "Ensure 'user' is not None before using it."
      ],
      "debug_steps": [
        "Log the value of 'user' before the failing line."
      ],
      "assumptions": [
        "The code is running on Python 3.x."
      ],
      "followup_questions": [
        "How is 'user' obtained?"
      ],
      "confidence": 0.9
    }
    """

    result = AIClient.parse_ai_response(raw)
    assert isinstance(result, AIResponse)
    assert result.language_detected.value == "python"
    assert result.confidence == pytest.approx(0.9)


def test_parse_ai_response_invalid_json_raises_parse_error():
    raw = "this is not json att all"

    with pytest.raises(AIResponseParseError):
        AIClient.parse_ai_response(raw)
    

def test_parse_ai_response_validation_error_raises_validation_error():
    raw = """
    {
      "language_detected": "python",
      "fix_steps": [],
      "debug_steps": [],
      "assumptions": [],
      "followup_questions": [],
      "confidence": 0.5
    }
    """

    with pytest.raises(AIResponseValidationError):
        AIClient.parse_ai_response(raw)

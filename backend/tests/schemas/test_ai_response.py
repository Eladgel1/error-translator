import pytest

from app.schemas.ai_response import AIResponse, SupportedLanguage


def test_ai_response_valid_payload():
    payload = {
        "language_detected": "python",
        "summary": "You are calling a method on a None value.",
        "likely_cause": "The variable 'user' is None when you try to access 'user.name'.",
        "fix_steps": [
            "Check where 'user' is assigned.",
            "Add a guard clause before accessing 'user.name'.",
        ],
        "debug_steps": [
            "Log the value of 'user' before the failing line.",
            "Add a breakpoint and inspect the call stack.",
        ],
        "assumptions": [
            "You are using Python 3.x.",
        ],
        "followup_questions": [
            "How is 'user' created?",
            "Is this code running inside a web request handler?",
        ],
        "confidence": 0.87,
    }

    ai_response = AIResponse(**payload)

    assert ai_response.language_detected == SupportedLanguage.PYTHON
    assert ai_response.confidence == pytest.approx(0.87)
    assert len(ai_response.fix_steps) == 2
    assert "guard clause" in ai_response.fix_steps[1].lower()


def test_ai_response_invalid_confidence_raises_error():
    payload = {
        "language_detected": "java",
        "summary": "Some error",
        "likely_cause": "Some cause",
        "fix_steps": [],
        "debug_steps": [],
        "assumptions": [],
        "followup_questions": [],
        "confidence": 1.5,  # invalid, > 1.0
    }

    with pytest.raises(ValueError):
        AIResponse(**payload)
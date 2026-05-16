import pytest
from app.main import app
from app.modules.analyses.dependencies import get_ai_client
from app.schemas.ai_response import AIResponse, SupportedLanguage
from fastapi.testclient import TestClient


class FakeAIClient:
    async def aclose(self) -> None:
        return
    
    async def generate_response(
        self,
        *,
        prompt: str,
        language: SupportedLanguage,
        version,
    ) -> AIResponse:
        return AIResponse(
            language_detected=language,
            summary="Followup summary",
            likely_cause="Followup cause",
            fix_steps=["Followup fix"],
            debug_steps=["Followup debug"],
            assumptions=["Followup assumptions"],
            followup_questions=["Followup question"],
            confidence=0.8
        )
    

@pytest.fixture(autouse=True)
def override_ai_client_dependency():
    app.dependency_overrides[get_ai_client] = lambda: FakeAIClient()
    yield
    app.dependency_overrides.pop(get_ai_client, None)


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def test_followup_returns_200(client: TestClient) -> None:
    payload = {
        "error_text": "TypeError: Cannot read properties of undefined",
        "context": "console.log(user.name)",
        "language_hint": "javascript",
        "previous_response": {
            "language_detected": "javascript",
            "summary": "Previous summary",
            "likely_cause": "Previous cause",
            "fix_steps": ["Previous fix"],
            "debug_steps": ["Previous debug"],
            "assumptions": ["Previous assumption"],
            "followup_questions": ["Previous question"],
            "confidence": 0.8,
        },
        "question": "How can I prevent this?",
    }

    response = client.post("/api/followup", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["language_detected"] == "javascript"
    assert data["summary"] == "Followup summary"
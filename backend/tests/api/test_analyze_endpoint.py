import pytest
from app.main import app
from app.modules.analyses.dependencies import get_ai_client
from app.schemas.ai_response import AIResponse, SupportedLanguage
from httpx import ASGITransport, AsyncClient


class FakeAIClient:
    """
    Test double for AIClient.

    It simulates a successful AI call by returning a fixed AIResponse instance.
    """

    async def aclose(self) -> None:
        # No-op for test client
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
            summary="Test summary",
            likely_cause="Test likely cause",
            fix_steps=["Test fix step 1"],
            assumptions=["Test assumption"],
            followup_questions=["Test followup"],
            confidence=0.99,
        )


@pytest.fixture(autouse=True)
def override_ai_client_dependency():
    """
    Automatically override the AI client dependency for all tests in this module.
    """
    app.dependency_overrides[get_ai_client] = lambda: FakeAIClient()
    yield
    app.dependency_overrides.pop(get_ai_client, None)


@pytest.mark.asyncio
async def test_analyze_missing_error_test_returns_422():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/analyze", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_valid_request_returns_ai_response():
    payload = {
        "error_text": "TypeError: Cannot read properties of undefined",
        "context": "const user = undefined; console.log(user.name);",
        "language_hint": "javascript",
    }

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post("/api/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    # Basic shape checks
    assert data["language_detected"] in ["javascript", "python", "java", "unknown"]
    assert "summary" in data
    assert "likely_cause" in data
    assert isinstance(data.get("fix_steps"), list)
    assert isinstance(data.get("debug_steps"), list)
    assert isinstance(data.get("assumptions"), list)
    assert isinstance(data.get("followup_questions"), list)
    assert isinstance(data.get("confidence"), (float, int))

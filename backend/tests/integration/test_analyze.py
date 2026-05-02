import pytest
from app.main import app
from app.modules.analysis.dependencies import get_ai_client
from app.schemas.ai_response import AIResponse, SupportedLanguage
from fastapi.testclient import TestClient


class FakeAIClient:
    """
    Test double for AIClient used in integration tests.

    It simulates a successful AI call by returning a fixed AIResponse instance,
    based on the language argument passed from the analyze endpoint.
    """

    async def aclose(self) -> None:
        return

    async def generate_response(
        self,
        *,
        prompt: str,
        language: SupportedLanguage,
        version,
    ) -> AIResponse:
        # Use the language passed from the pipeline so we can assert behavior
        return AIResponse(
            language_detected=language,
            summary="Integration test summary",
            likely_cause="Integration test likely cause",
            fix_steps=["Integration test fix step"],
            debug_steps=["Integration test debug step"],
            assumptions=["Integration test assumption"],
            followup_questions=["Integration test follow-up question"],
            confidence=0.9,
        )


@pytest.fixture(autouse=True)
def override_ai_client_dependency():
    """
    Override the get_ai_client dependency so that the integration tests
    never call the real AI provider.
    """
    app.dependency_overrides[get_ai_client] = lambda: FakeAIClient()
    yield
    app.dependency_overrides.pop(get_ai_client, None)


@pytest.fixture()
def client() -> TestClient:
    """
    Synchronous TestClient for hitting the real FastAPI app
    with middlewares and routes configured.
    """
    return TestClient(app)


def test_analyze_returns_422_when_error_text_is_missing(client: TestClient) -> None:
    """
    When the request body does not contain the required 'error_text' field,
    FastAPI/Pydantic should return 422 Unprocessable Entity.
    """
    response = client.post("/api/analyze", json={})

    assert response.status_code == 422
    body = response.json()

    assert "error" in body
    assert body["error"]["code"] == "validation_error"
    assert "details" in body["error"]
    assert "errors" in body["error"]["details"]
    assert len(body["error"]["details"]["errors"]) > 0


def test_analyze_returns_200_and_valid_schema_for_valid_request(
    client: TestClient,
) -> None:
    """
    For a valid payload, the endpoint should return 200 and a JSON body
    that matches the AIResponse shape.
    """

    payload = {
        "error_text": "TypeError: Cannot read properties of undefined",
        "context": "const user = undefined; console.log(user.name);",
        "language_hint": "javascript",
    }

    response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    # Basic schema shape assertions
    assert data["language_detected"] in ["javascript", "python", "java", "unknown"]
    assert isinstance(data.get("summary"), str)
    assert isinstance(data.get("likely_cause"), str)
    assert isinstance(data.get("fix_steps"), list)
    assert isinstance(data.get("debug_steps"), list)
    assert isinstance(data.get("assumptions"), list)
    assert isinstance(data.get("followup_questions"), list)
    assert isinstance(data.get("confidence"), (float, int))


def test_analyze_respects_language_hint_in_payload(client: TestClient) -> None:
    """
    Ensure that when a language_hint is provided, the pipeline passes
    the resolved language enum down to the AI client.

    Since FakeAIClient echoes back the 'language' argument into
    AIResponse.language_detected, we can assert the behavior end-to-end.
    """

    payload = {
        "error_text": "Some generic error without clear language markers",
        "language_hint": "javascript",
    }

    response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    # If the hint was correctly resolved and propagated, this should be "javascript".
    assert data["language_detected"] == "javascript"

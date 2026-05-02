import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)

def test_health_smoke() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_unknown_route_returns_404() -> None:
    client = TestClient(app)

    response = client.get("/does-not-exist")

    assert response.status_code == 404

def test_analyze_validation_error_when_error_text_is_empty(client: TestClient) -> None:
    response = client.post(
        "/api/analyze",
        json={
            "error_text": "",
            "language_hint": "python",
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
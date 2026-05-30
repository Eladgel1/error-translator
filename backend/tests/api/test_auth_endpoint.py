from app.main import app
from fastapi.testclient import TestClient


def test_me_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_analyses_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/api/analyses")

    assert response.status_code == 401
from httpx import AsyncClient, ASGITransport
from app.main import app
import pytest

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "app" in data
        assert "environment" in data

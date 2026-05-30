from collections.abc import AsyncGenerator

from app.services.ai.client import AIClient


async def get_ai_client() -> AsyncGenerator[AIClient, None]:
    """
    Create a per-request AIClient instance and ensure it is closed properly.
    """
    client = AIClient()
    try:
        yield client
    finally:
        await client.aclose()
import json
from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.schemas.ai_response import AIResponse, SupportedLanguage
from app.services.ai.errors import (
    AIClientError,
    AIConfigurationError,
    AINetworkError,
    AIProviderError,
    AIResponseParseError,
    AIResponseValidationError,
)
from app.services.ai.prompts.registry import PromptVersion

# AI Client Configuration


class AIClientConfig(BaseModel):
    base_url: str
    api_key: Optional[str]
    model: str
    timeout_seconds: float = 15.0
    max_retries: int = 2
    provider: str = "gemini"

    @classmethod
    def from_settings(cls) -> "AIClientConfig":
        return cls(
            base_url=settings.ai_base_url,
            api_key=settings.ai_api_key,
            model=settings.ai_model,
            timeout_seconds=settings.ai_request_timeout_seconds,
            max_retries=settings.ai_max_retries,
            provider=settings.ai_provider,
        )


# AI Client (Gemini 3 Flash)
class AIClient:
    """
    Provider-agnostic AI client.
    Public interface:
      generate_response(prompt=..., language=..., version=...) -> AIResponse
    """

    def __init__(
        self,
        config: Optional[AIClientConfig] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._config = config or AIClientConfig.from_settings()

        if not self._config.api_key:
            raise AIConfigurationError("GEMINI_API_KEY is not configured.")

        self._client = http_client or httpx.AsyncClient(
            base_url=self._config.base_url,
            timeout=self._config.timeout_seconds,
        )

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    # ---- Main AI call ----

    async def generate_response(
        self,
        *,
        prompt: str,
        language: SupportedLanguage,
        version: PromptVersion = PromptVersion.V1,
    ) -> AIResponse:
        """
        Send the rendered to the AI provider and return a validated AIResponse.
        """

        payload = self._build_request_body(prompt=prompt)
        endpoint = self._build_endpoint()
        last_exc: Optional[Exception] = None

        for attempt in range(self._config.max_retries + 1):
            try:
                response = await self._client.post(
                    endpoint,
                    headers=self._build_headers(),
                    json=payload,
                )

                if 500 <= response.status_code:
                    raise AIProviderError(
                        status_code=response.status_code,
                        message="AI provider server error",
                    )

                if 400 <= response.status_code < 500:
                    raise AIProviderError(
                        status_code=response.status_code,
                        message=response.text,
                    )

                raw_text = self._extract_content(response.json())
                return self.parse_ai_response(raw_text)

            except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPError) as exc:
                last_exc = exc
                if attempt == self._config.max_retries:
                    raise AINetworkError("Failed to reach AI provider.") from exc

            except AIClientError:
                raise

        raise AINetworkError("AI call failed after retrues") from last_exc

    # ---- Gemini-specific request building ----
    def _build_headers(self) -> Dict[str, str]:
        if self._config.provider == "gemini":
            return {
                "x-goog-api-key": self._config.api_key or "",
                "Content-Type": "application/json",
            }

        return {
            "Authorization": f"Bearer {self._config.api_key}",
            "Content-Type": "application/json",
        }

    def _build_endpoint(self) -> str:
        """
        Gemini REST endpoint:
          POST /v1beta/models/{model}:generateContent
        """
        if self._config.provider == "gemini":
            return f"/models/{self._config.model}:generateContent"

        return "/"

    def _build_request_body(self, *, prompt: str) -> Dict[str, Any]:
        """
        Build the request body for Gemini (JSON mode).
        """
        if self._config.provider == "gemini":
            return {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                },
            }

        return {"contents": [{"parts": [{"text": prompt}]}]}

    # ---- Extract Gemini JSON text ----
    def _extract_content(self, provider_response: Dict[str, Any]) -> str:
        """
        Extract the raw content string from Gemini response:
          candidates[0].content.parts[0].text
        """
        if self._config.provider == "gemini":
            try:
                return provider_response["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError, TypeError) as exc:
                raise AIResponseParseError(raw_content=json.dumps(provider_response)) from exc

        try:
            return str(provider_response["output"])
        except KeyError as exc:
            raise AIResponseParseError(raw_content=json.dumps(provider_response)) from exc

    # ---- JSON → AIResponse ----
    @staticmethod
    def parse_ai_response(raw_text: str) -> AIResponse:
        """
        Parse raw LLM output string into AIResponse using strict JSON + Pydantic validation.
        """

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise AIResponseParseError(raw_content=raw_text) from exc

        try:
            return AIResponse.model_validate(data)
        except ValidationError as exc:
            raise AIResponseValidationError(errors=exc.errors()) from exc

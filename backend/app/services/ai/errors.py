from typing import Any


class AIClientError(Exception):
    """Base exception for AI client related errors."""


class AINetworkError(AIClientError):
    """Raised when the AI provider cannot be reached (network/timeout issues)."""


class AIProviderError(AIClientError):
    """Raised when the AI provider returns an error response (4xx/5xx)."""

    def __init__(self, status_code: int, message: str = "AI provider error") -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"{message} (status_code={status_code})")


class AIResponseParseError(AIClientError):
    "Raised when the AI response cannot be parsed as JSON."

    def __init__(self, raw_content: str) -> None:
        self.raw_content = raw_content
        super().__init__("Failed to parse AI response as JSON.")


class AIResponseValidationError(AIClientError):
    """Raised when the AI response JSON does not match the expected schema."""

    def __init__(self, errors: Any) -> None:
        self.errors = errors
        super().__init__("AI response failed schema validation.")


class AIConfigurationError(AIClientError):
    """Raised when required AI configuration (e.g. API key) is missing."""

    pass

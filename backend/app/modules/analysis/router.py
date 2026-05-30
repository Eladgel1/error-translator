from fastapi import APIRouter, Depends

from app.modules.analysis.dependencies import get_ai_client
from app.modules.analysis.schemas import AnalyzeRequest
from app.modules.analysis.service import analyze_error_message
from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient

router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze",
    response_model=AIResponse,
    summary="Analyze an error message and return structed JSON from AI.",
)
async def analyze_error(
    payload: AnalyzeRequest,
    ai_client: AIClient = Depends(get_ai_client),    
) -> AIResponse:
    return await analyze_error_message(
        payload=payload,
        ai_client=ai_client
    )
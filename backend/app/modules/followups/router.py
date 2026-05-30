from fastapi import APIRouter, Depends

from app.modules.analyses.dependencies import get_ai_client
from app.modules.followups.schemas import FollowupRequest
from app.modules.followups.service import followup_analysis_message
from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient

router = APIRouter(tags=["followup"])

@router.post(
    "/followup",
    response_model=AIResponse,
    summary="Ask a follow-up question about a previos error analysis.",
)
async def followup_analysis(
    payload: FollowupRequest,
    ai_client: AIClient = Depends(get_ai_client),
) -> AIResponse:
    return await followup_analysis_message(
        payload=payload,
        ai_client=ai_client,
    )
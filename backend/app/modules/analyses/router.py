from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.modules.analyses.dependencies import get_ai_client
from app.modules.analyses.repository import (
    delete_user_analysis,
    get_user_analysis_by_id,
    list_user_analyses,
    toggle_analysis_favorite,
)
from app.modules.analyses.schemas import AnalyzeRequest, PersistedAnalysisResponse
from app.modules.analyses.service import analyze_and_persist_error_message, analyze_error_message
from app.modules.auth.dependencies import get_current_user
from app.schemas.ai_response import AIResponse
from app.services.ai.client import AIClient

router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze",
    response_model=AIResponse,
    summary="Analyze an error message and return structured JSON from AI.",
)
async def analyze_error(
    payload: AnalyzeRequest,
    ai_client: AIClient = Depends(get_ai_client),    
) -> AIResponse:
    """
    Stateless analysis endpoint.

    Kept for backward compatibility with the existing frontend/tests.
    This endpoint does not require authentication and does not persist history.
    """

    return await analyze_error_message(
        payload=payload,
        ai_client=ai_client,
    )

@router.post(
    "/analyses/analyze",
    response_model=PersistedAnalysisResponse,
    summary="Analyze an error message and persist it for the authenticated user.",
)
async def analyze_error_persisted(
    payload: AnalyzeRequest,
    ai_client: AIClient = Depends(get_ai_client),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersistedAnalysisResponse:
    analysis = await analyze_and_persist_error_message(
        payload=payload,
        ai_client=ai_client,
        db=db,
        current_user=current_user,
    )

    return PersistedAnalysisResponse.model_validate(analysis)


@router.get(
    "/analyses",
    response_model=list[PersistedAnalysisResponse],
    summary="List analyses for the authenticated user.",
)
async def get_my_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PersistedAnalysisResponse]:
    analyses = await list_user_analyses(
        db,
        user_id=current_user.id,
    )

    return [
        PersistedAnalysisResponse.model_validate(analysis)
        for analysis in analyses
    ]


@router.get(
    "/analyses/{analysis_id}",
    response_model=PersistedAnalysisResponse,
    summary="Get a single analysis for the authenticated user.",
)
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersistedAnalysisResponse:
    analysis = await get_user_analysis_by_id(
        db,
        user_id=current_user.id,
        analysis_id=analysis_id,
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )
    
    return PersistedAnalysisResponse.model_validate(analysis)


@router.delete(
    "/analyses/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analysis for the authenticated user.",
)
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    deleted = await delete_user_analysis(
        db,
        user_id=current_user.id,
        analysis_id=analysis_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )
    

@router.patch(
    "/analyses/{analysis_id}/favorite",
    response_model=PersistedAnalysisResponse,
    summary="Toggle favorite status for an analysis.",
)
async def toggle_favorite(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersistedAnalysisResponse:
    analysis = await toggle_analysis_favorite(
        db,
        user_id=current_user.id,
        analysis_id=analysis_id,
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )
    
    return PersistedAnalysisResponse.model_validate(analysis)
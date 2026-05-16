from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.analysis_message import AnalysisMessage
from app.schemas.ai_response import AIResponse


async def create_analysis_record(
    db: AsyncSession,
    *,
    user_id: str,
    title: str,
    error_text: str,
    context: str | None,
    language_hint: str | None,
    ai_response: AIResponse,
) -> Analysis:
    analysis = Analysis(
        user_id=user_id,
        title=title,
        error_text=error_text,
        context=context,
        language_hint=language_hint,
        language_detected=ai_response.language_detected.value,
        summary=ai_response.summary,
        likely_cause=ai_response.likely_cause,
        fix_steps=ai_response.fix_steps,
        debug_steps=ai_response.debug_steps,
        assumptions=ai_response.assumptions,
        followup_questions=ai_response.followup_questions,
        confidence=ai_response.confidence,
    )

    db.add(analysis)
    await db.flush()

    user_message = AnalysisMessage(
        analysis_id=analysis.id,
        role="user",
        content=error_text,
    )

    assistant_message = AnalysisMessage(
        analysis_id=analysis.id,
        role="assistant",
        content=ai_response.model_dump_json(),
    )

    db.add_all([user_message, assistant_message])

    await db.commit()
    await db.refresh(analysis)

    return analysis


async def list_user_analyses(
    db: AsyncSession,
    *,
    user_id: str,
) -> list[Analysis]:
    result = await db.execute(
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .order_by(desc(Analysis.created_at))
    )

    return list(result.scalars().all())


async def get_user_analysis_by_id(
    db: AsyncSession,
    *,
    user_id: str,
    analysis_id: str,
) -> Analysis | None:
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == user_id,
        )
    )

    return result.scalar_one_or_none()


async def delete_user_analysis(
    db: AsyncSession,
    *,
    user_id: str,
    analysis_id: str,
) -> bool:
    analysis = await get_user_analysis_by_id(
        db,
        user_id=user_id,
        analysis_id=analysis_id,
    )

    if analysis is None:
        return False
    
    await db.delete(analysis)
    await db.commit()

    return True


async def toggle_analysis_favorite(
    db: AsyncSession,
    *,
    user_id: str,
    analysis_id: str,
) -> Analysis | None:
    analysis = await get_user_analysis_by_id(
        db,
        user_id=user_id,
        analysis_id=analysis_id,
    )

    if analysis is None:
        return None
    
    analysis.is_favorite = not analysis.is_favorite

    await db.commit()
    await db.refresh(analysis)

    return analysis
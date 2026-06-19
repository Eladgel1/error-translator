from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.password_reset_code import PasswordResetCode
from app.models.user import User
from app.modules.auth.repository import (
    create_password_reset_code,
    create_user,
    get_latest_active_password_reset_code,
    get_user_by_email,
    increment_password_reset_attempts,
    mark_active_password_reset_codes_used,
    mark_password_reset_code_used,
    update_user_password_hash,
)
from app.modules.auth.schemas import (
    PasswordResetConfirm,
    PasswordResetMessageResponse,
    PasswordResetRequest,
    PasswordResetVerify,
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.modules.auth.security import (
    create_access_token,
    generate_reset_code,
    hash_password,
    hash_reset_code,
    verify_password,
    verify_reset_code_hash,
)
from app.services.email.sender import EmailDeliveryError, send_password_reset_code

PASSWORD_RESET_REQUEST_MESSAGE = (
    "If an account exists for this email, a verification code has been sent."
)
PASSWORD_RESET_VERIFY_MESSAGE = "Verification code confirmed."
PASSWORD_RESET_CONFIRM_MESSAGE = "Password has been reset successfully."
INVALID_RESET_CODE_MESSAGE = "Invalid or expired verification code."
TOO_MANY_RESET_ATTEMPTS_MESSAGE = "Too many invalid attempts. Please request a new code."
PASSWORD_RESET_EMAIL_FAILED_MESSAGE = (
    "Failed to send password reset email. Please try again later."
)

async def register_user(
    db: AsyncSession,
    payload: UserCreate,
) -> TokenResponse:
    existing_user = await get_user_by_email(db, payload.email)

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered.",
        )
    
    user = await create_user(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )

    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=user,
    )


async def login_user(
    db: AsyncSession,
    payload: UserLogin,
) -> TokenResponse:
    user = await get_user_by_email(db, payload.email)

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=user,
    )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _is_reset_code_expired(
    reset_code: PasswordResetCode,
    *,
    now: datetime,
) -> bool:
    return reset_code.expires_at <= now


def _is_reset_resend_cooldown_active(
    reset_code: PasswordResetCode,
    *,
    now: datetime,
) -> bool:
    next_send_available_at = reset_code.created_at + timedelta(
        seconds=settings.password_reset_resend_cooldown_seconds,
    )

    return next_send_available_at > now


async def request_password_reset(
    db: AsyncSession,
    payload: PasswordResetRequest,
) -> PasswordResetMessageResponse:
    email = str(payload.email).lower()
    user = await get_user_by_email(db, email)

    if user is None:
        return PasswordResetMessageResponse(
            message=PASSWORD_RESET_REQUEST_MESSAGE,
        )
    
    user_id = user.id
    now = _utc_now()
    latest_reset_code = await get_latest_active_password_reset_code(
        db,
        user_id=user_id,
    )

    if latest_reset_code is not None and _is_reset_resend_cooldown_active(
        latest_reset_code,
        now=now,
    ):
        return PasswordResetMessageResponse(
            message=PASSWORD_RESET_REQUEST_MESSAGE,
        )

    code = generate_reset_code()
    code_hash = hash_reset_code(
        email=email,
        code=code,
    )

    await mark_active_password_reset_codes_used(
        db,
        user_id=user_id,
        used_at=now,
    )

    await create_password_reset_code(
        db,
        user_id=user_id,
        code_hash=code_hash,
        expires_at=now
        + timedelta(minutes=settings.password_reset_code_ttl_minutes),
    )

    try:
        await send_password_reset_code(
            email=email,
            code=code,
            expires_in_minutes=settings.password_reset_code_ttl_minutes,
        )
    except EmailDeliveryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=PASSWORD_RESET_EMAIL_FAILED_MESSAGE,
        ) from exc

    return PasswordResetMessageResponse(
        message=PASSWORD_RESET_REQUEST_MESSAGE,
    )


async def _get_valid_password_reset_code(
    db: AsyncSession,
    *,
    email: str,
    code: str,
    increment_attempts_on_failure: bool,
) -> tuple[User, PasswordResetCode]:
    user = await get_user_by_email(db, email)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_RESET_CODE_MESSAGE,
        )

    reset_code = await get_latest_active_password_reset_code(
        db,
        user_id=user.id,
    )

    if reset_code is None or _is_reset_code_expired(reset_code, now=_utc_now()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_RESET_CODE_MESSAGE,
        )

    if reset_code.attempts >= settings.password_reset_max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=TOO_MANY_RESET_ATTEMPTS_MESSAGE,
        )

    is_valid = verify_reset_code_hash(
        email=email,
        code=code,
        code_hash=reset_code.code_hash,
    )

    if not is_valid:
        if increment_attempts_on_failure:
            await increment_password_reset_attempts(
                db,
                reset_code=reset_code,
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_RESET_CODE_MESSAGE,
        )

    return user, reset_code


async def verify_password_reset_code(
    db: AsyncSession,
    payload: PasswordResetVerify,
) -> PasswordResetMessageResponse:
    await _get_valid_password_reset_code(
        db,
        email=str(payload.email).lower(),
        code=payload.code,
        increment_attempts_on_failure=True,
    )

    return PasswordResetMessageResponse(
        message=PASSWORD_RESET_VERIFY_MESSAGE,
    )


async def confirm_password_reset(
    db: AsyncSession,
    payload: PasswordResetConfirm,
) -> PasswordResetMessageResponse:
    user, reset_code = await _get_valid_password_reset_code(
        db,
        email=str(payload.email).lower(),
        code=payload.code,
        increment_attempts_on_failure=True,
    )

    await update_user_password_hash(
        db,
        user=user,
        password_hash=hash_password(payload.new_password),
    )

    await mark_password_reset_code_used(
        db,
        reset_code=reset_code,
        used_at=_utc_now(),
    )

    return PasswordResetMessageResponse(
        message=PASSWORD_RESET_CONFIRM_MESSAGE,
    )
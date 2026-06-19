from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import (
    PasswordResetConfirm,
    PasswordResetMessageResponse,
    PasswordResetRequest,
    PasswordResetVerify,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.modules.auth.service import (
    confirm_password_reset,
    login_user,
    register_user,
    request_password_reset,
    verify_password_reset_code,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await register_user(db, payload)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await login_user(db, payload)


@router.post("/password-reset/request", response_model=PasswordResetMessageResponse)
async def request_reset_password(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetMessageResponse:
    return await request_password_reset(db, payload)


@router.post("/password-reset/verify", response_model=PasswordResetMessageResponse)
async def verify_reset_password_code(
    payload: PasswordResetVerify,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetMessageResponse:
    return await verify_password_reset_code(db, payload)


@router.post("/password-reset/confirm", response_model=PasswordResetMessageResponse)
async def confirm_reset_password(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetMessageResponse:
    return await confirm_password_reset(db, payload)


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user
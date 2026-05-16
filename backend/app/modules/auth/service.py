from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import (
    create_user,
    get_user_by_email,
)
from app.modules.auth.schemas import (
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.modules.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
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
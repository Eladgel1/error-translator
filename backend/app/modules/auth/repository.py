from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_code import PasswordResetCode
from app.models.user import User


async def get_user_by_email(
    db: AsyncSession,
    email: str,
) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email.lower())
    )

    return result.scalar_one_or_none()


async def get_user_by_id(
    db: AsyncSession,
    user_id: str,
) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    *,
    email: str,
    full_name: str,
    password_hash: str,
) -> User:
    user = User(
        email=email.lower(),
        full_name=full_name,
        password_hash=password_hash,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def mark_active_password_reset_codes_used(
    db: AsyncSession,
    *,
    user_id: str,
    used_at: datetime,
) -> None:
    await db.execute(
        update(PasswordResetCode)
        .where(PasswordResetCode.user_id == user_id)
        .where(PasswordResetCode.used_at.is_(None))
        .values(
            used_at=used_at,
            updated_at=used_at,
        )
    )

    await db.commit()


async def create_password_reset_code(
    db: AsyncSession,
    *,
    user_id: str,
    code_hash: str,
    expires_at: datetime,
) -> PasswordResetCode:
    reset_code = PasswordResetCode(
        user_id=user_id,
        code_hash=code_hash,
        expires_at=expires_at,
    )

    db.add(reset_code)
    await db.commit()
    await db.refresh(reset_code)

    return reset_code


async def get_latest_active_password_reset_code(
    db: AsyncSession,
    *,
    user_id: str,
) -> PasswordResetCode | None:
    result = await db.execute(
        select(PasswordResetCode)
        .where(PasswordResetCode.user_id == user_id)
        .where(PasswordResetCode.used_at.is_(None))
        .order_by(PasswordResetCode.created_at.desc())
        .limit(1)
    )

    return result.scalar_one_or_none()


async def increment_password_reset_attempts(
    db: AsyncSession,
    *,
    reset_code: PasswordResetCode,
) -> PasswordResetCode:
    reset_code.attempts += 1

    await db.commit()
    await db.refresh(reset_code)

    return reset_code


async def update_user_password_hash(
    db: AsyncSession,
    *,
    user: User,
    password_hash: str,
) -> User:
    user.password_hash = password_hash

    await db.commit()
    await db.refresh(user)

    return user


async def mark_password_reset_code_used(
    db: AsyncSession,
    *,
    reset_code: PasswordResetCode,
    used_at: datetime,
) -> PasswordResetCode:
    reset_code.used_at = used_at
    reset_code.updated_at = used_at

    await db.commit()
    await db.refresh(reset_code)

    return reset_code
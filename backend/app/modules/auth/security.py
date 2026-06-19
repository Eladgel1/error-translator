import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_reset_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_reset_code(
    *,
    email: str,
    code: str,
) -> str:
    message = f"{email.lower()}:{code}".encode("utf-8")
    secret = settings.jwt_secret_key.encode("utf-8")

    return hmac.new(
        secret,
        message,
        hashlib.sha256,
    ).hexdigest()


def verify_reset_code_hash(
    *,
    email: str,
    code: str,
    code_hash: str,
) -> bool:
    expected_hash = hash_reset_code(
        email=email,
        code=code,
    )

    return hmac.compare_digest(expected_hash, code_hash)

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )

    payload = {
        "sub": user_id,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise ValueError("Invalid access token") from exc
    
    user_id = payload.get("sub")

    if not isinstance(user_id, str) or not user_id:
        raise ValueError("Invalid token subject")
    
    return user_id

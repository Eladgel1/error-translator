import asyncio
import smtplib
from email.message import EmailMessage
from html import escape

from app.core.config import settings


class EmailDeliveryError(RuntimeError):
    pass


def _build_password_reset_text(
    *,
    code: str,
    expires_in_minutes: int,
) -> str:
    return (
        "Your Error Translator password reset code is:\n\n"
        f"{code}\n\n"
        f"This code will expire in {expires_in_minutes} minutes.\n\n"
        "If you did not request a password reset, you can safely ignore this email."
    )


def _build_password_reset_html(
    *,
    code: str,
    expires_in_minutes: int,
) -> str:
    safe_code = escape(code)

    return f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Error Translator password reset</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">
        {safe_code}
      </p>
      <p>This code will expire in {expires_in_minutes} minutes.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    </div>
    """


def _build_sender_address() -> str:
    if not settings.smtp_from_email:
        raise EmailDeliveryError("SMTP_FROM_EMAIL is not configured.")

    return f"{settings.smtp_from_name} <{settings.smtp_from_email}>"


def _send_email_sync(message: EmailMessage) -> None:
    if not settings.smtp_username:
        raise EmailDeliveryError("SMTP_USERNAME is not configured.")

    if not settings.smtp_password:
        raise EmailDeliveryError("SMTP_PASSWORD is not configured.")

    try:
        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=settings.smtp_request_timeout_seconds,
        ) as server:
            if settings.smtp_use_tls:
                server.starttls()

            server.login(
                settings.smtp_username,
                settings.smtp_password,
            )
            server.send_message(message)
    except smtplib.SMTPException as exc:
        raise EmailDeliveryError("Failed to send email through SMTP.") from exc
    except OSError as exc:
        raise EmailDeliveryError("Failed to connect to SMTP server.") from exc


async def send_password_reset_code(
    *,
    email: str,
    code: str,
    expires_in_minutes: int,
) -> None:
    message = EmailMessage()
    message["From"] = _build_sender_address()
    message["To"] = email
    message["Subject"] = "Your Error Translator password reset code"

    message.set_content(
        _build_password_reset_text(
            code=code,
            expires_in_minutes=expires_in_minutes,
        )
    )
    message.add_alternative(
        _build_password_reset_html(
            code=code,
            expires_in_minutes=expires_in_minutes,
        ),
        subtype="html",
    )

    await asyncio.to_thread(_send_email_sync, message)
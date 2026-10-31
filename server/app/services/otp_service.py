import hmac
import hashlib
import secrets
from datetime import datetime, timedelta

from flask import current_app
from sqlalchemy import case, update

from app.extensions import db
from app.models.otp import OtpCode

OTP_LENGTH = 6


def _hash_code(code: str) -> str:
    key = current_app.config["JWT_SECRET_KEY"].encode()
    return hmac.new(key, code.encode(), hashlib.sha256).hexdigest()


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_otp() -> str:
    return "".join(
        str(secrets.randbelow(10))
        for _ in range(OTP_LENGTH)
    )


def create_otp_for_user(
    user_id: str,
    purpose: str = "password_reset",
) -> tuple[str, str]:
    """Create a new OTP and invalidate previous recovery credentials."""

    previous_otps = OtpCode.query.filter_by(
        user_id=user_id,
        purpose=purpose,
    ).all()

    for previous in previous_otps:
        if not previous.is_used or previous.reset_token_hash:
            previous.is_used = True
            previous.reset_token_hash = None
            previous.reset_token_expires_at = None

    raw_code = generate_otp()

    expiry_minutes = current_app.config.get(
        "OTP_EXPIRY_MINUTES",
        10,
    )

    otp = OtpCode(
        user_id=user_id,
        code_hash=_hash_code(raw_code),
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes),
    )

    db.session.add(otp)
    db.session.commit()

    return raw_code, otp.id


def invalidate_otp(otp_id: str) -> None:
    """Invalidate a specific OTP if its delivery fails."""

    otp = db.session.get(OtpCode, otp_id)

    if otp:
        otp.is_used = True
        otp.reset_token_hash = None
        otp.reset_token_expires_at = None
        db.session.commit()


def verify_reset_code(
    user_id: str,
    submitted_code: str,
    purpose: str = "password_reset",
) -> str | None:
    """
    Verify an OTP and atomically consume it.

    Only one concurrent request can successfully consume an OTP.
    Only the hash of the generated reset token is stored.
    """

    max_attempts = current_app.config.get("OTP_MAX_ATTEMPTS", 5)

    otp = (
        OtpCode.query.filter_by(
            user_id=user_id,
            purpose=purpose,
            is_used=False,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp:
        return None

    now = datetime.utcnow()

    if otp.attempts >= max_attempts:
        db.session.execute(
            update(OtpCode)
            .where(
                OtpCode.id == otp.id,
                OtpCode.is_used.is_(False),
            )
            .values(is_used=True)
        )
        db.session.commit()
        return None

    if otp.expires_at <= now:
        return None

    submitted_hash = _hash_code(submitted_code)

    if not hmac.compare_digest(submitted_hash, otp.code_hash):
        result = db.session.execute(
            update(OtpCode)
            .where(
                OtpCode.id == otp.id,
                OtpCode.is_used.is_(False),
                OtpCode.attempts < max_attempts,
                OtpCode.expires_at > now,
            )
            .values(
                attempts=OtpCode.attempts + 1,
                is_used=case(
                    (
                        OtpCode.attempts + 1 >= max_attempts,
                        True,
                    ),
                    else_=False,
                ),
            )
        )

        db.session.commit()

        if result.rowcount != 1:
            return None

        return None

    raw_token = secrets.token_urlsafe(32)

    expiry_minutes = current_app.config.get(
        "RESET_TOKEN_EXPIRY_MINUTES",
        10,
    )

    result = db.session.execute(
        update(OtpCode)
        .where(
            OtpCode.id == otp.id,
            OtpCode.is_used.is_(False),
            OtpCode.code_hash == submitted_hash,
            OtpCode.attempts < max_attempts,
            OtpCode.expires_at > now,
        )
        .values(
            is_used=True,
            attempts=OtpCode.attempts + 1,
            reset_token_hash=_hash_reset_token(raw_token),
            reset_token_expires_at=(
                now + timedelta(minutes=expiry_minutes)
            ),
        )
    )

    db.session.commit()

    if result.rowcount != 1:
        return None

    return raw_token


def find_valid_reset_token(raw_token: str) -> OtpCode | None:
    """Find an unused, unexpired reset authorization."""

    token_hash = _hash_reset_token(raw_token)

    otp = OtpCode.query.filter_by(
        reset_token_hash=token_hash,
        purpose="password_reset",
    ).first()

    if not otp or not otp.reset_token_expires_at:
        return None

    if datetime.utcnow() >= otp.reset_token_expires_at:
        return None

    return otp
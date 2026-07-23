import hmac
import hashlib
import secrets
from datetime import datetime, timedelta

from flask import current_app

from app.extensions import db
from app.models.otp import OtpCode

OTP_LENGTH = 6


def _hash_code(code: str) -> str:
    """HMAC-SHA256 keyed with the app's JWT secret as a pepper. Fast is fine
    here (unlike password hashing) because brute force is already blocked by
    short expiry + a hard attempt limit, not hashing cost."""
    key = current_app.config["JWT_SECRET_KEY"].encode()
    return hmac.new(key, code.encode(), hashlib.sha256).hexdigest()


def generate_otp() -> str:
    """Cryptographically secure 6-digit code - not random.randint, which is
    predictable and unsuitable for anything security-sensitive."""
    return "".join(str(secrets.randbelow(10)) for _ in range(OTP_LENGTH))


def create_otp_for_user(user_id: str, purpose: str = "password_reset") -> str:
    """Invalidates any previous unused OTPs for this purpose, then issues a
    fresh one. Returns the RAW code (only time it ever exists in plaintext) -
    caller is responsible for sending it and then discarding it immediately."""
    OtpCode.query.filter_by(user_id=user_id, purpose=purpose, is_used=False).update(
        {"is_used": True}
    )

    raw_code = generate_otp()
    expiry_minutes = current_app.config.get("OTP_EXPIRY_MINUTES", 10)

    otp = OtpCode(
        user_id=user_id,
        code_hash=_hash_code(raw_code),
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes),
    )
    db.session.add(otp)
    db.session.commit()

    return raw_code


def verify_otp(user_id: str, submitted_code: str, purpose: str = "password_reset") -> bool:
    """Checks the most recent unused OTP for this user+purpose. Increments
    attempts on every check (even wrong ones) and locks it out permanently
    after too many tries, regardless of expiry."""
    max_attempts = current_app.config.get("OTP_MAX_ATTEMPTS", 5)

    otp = (
        OtpCode.query.filter_by(user_id=user_id, purpose=purpose, is_used=False)
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp or not otp.is_valid():
        return False

    if otp.attempts >= max_attempts:
        otp.is_used = True
        db.session.commit()
        return False

    otp.attempts += 1

    submitted_hash = _hash_code(submitted_code)
    is_correct = hmac.compare_digest(submitted_hash, otp.code_hash)

    if is_correct:
        otp.is_used = True

    db.session.commit()
    return is_correct
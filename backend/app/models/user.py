import uuid
from datetime import datetime, date, timedelta
from enum import Enum

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.extensions import db

ph = PasswordHasher()  # Argon2id, tuned defaults - stronger than bcrypt against GPU cracking


class UserRole(str, Enum):
    MOTHER = "mother"
    EMPLOYER = "employer"
    ADMIN = "admin"


def generate_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.MOTHER.value)

    # Optional - not required at signup since a mother may register before
    # she's ready to enter this, or the app may support pre-birth users
    # later. Powers the postpartum-week indicator on the Dashboard; null
    # simply means that indicator doesn't show yet.
    baby_birth_date = db.Column(db.Date, nullable=True)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)

    # Account lockout tracking - stops brute force without exposing why to the caller
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)

    # Consent trail - required for DPA compliance on health data collection
    consent_given_at = db.Column(db.DateTime, nullable=True)
    consent_version = db.Column(db.String(20), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_password(self, raw_password: str) -> None:
        self.password_hash = ph.hash(raw_password)

    def verify_password(self, raw_password: str) -> bool:
        try:
            valid = ph.verify(self.password_hash, raw_password)
        except VerifyMismatchError:
            return False
        # Argon2 params get stronger over time - rehash transparently if the
        # stored hash used older/weaker parameters than current config.
        if valid and ph.check_needs_rehash(self.password_hash):
            self.set_password(raw_password)
        return valid

    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > datetime.utcnow())

    def register_failed_login(self, max_attempts: int, lockout_minutes: int) -> None:
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)

    def reset_login_attempts(self) -> None:
        self.failed_login_attempts = 0
        self.locked_until = None

    def postpartum_weeks(self):
        """Returns None if no birth date is set yet - callers must handle
        that as 'don't show this indicator', not as zero."""
        if not self.baby_birth_date:
            return None
        if self.baby_birth_date > date.today():
            return None  # future date shouldn't happen, but never show negative weeks
        return (date.today() - self.baby_birth_date).days // 7

    def to_public_dict(self) -> dict:
        """Safe subset of fields for API responses - never leaks password_hash."""
        return {
            "id": self.id,
            "email": self.email,
            "phone_number": self.phone_number,
            "full_name": self.full_name,
            "role": self.role,
            "is_email_verified": self.is_email_verified,
            "baby_birth_date": self.baby_birth_date.isoformat() if self.baby_birth_date else None,
            "postpartum_weeks": self.postpartum_weeks(),
            "created_at": self.created_at.isoformat(),
        }


class TokenBlocklist(db.Model):
    """Revoked JWT identifiers - checked on every request so logout is real,
    not just 'client throws away the token and hopes'."""

    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True, unique=True)
    token_type = db.Column(db.String(10), nullable=False)  # "access" or "refresh"
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
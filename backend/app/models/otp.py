import uuid
from datetime import datetime

from app.extensions import db


def generate_uuid():
    return str(uuid.uuid4())


class OtpCode(db.Model):
    """One-time codes for password recovery (and reusable later for phone
    verification). Never store the raw code - only its hash, same principle
    as passwords."""

    __tablename__ = "otp_codes"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    code_hash = db.Column(db.String(255), nullable=False)
    purpose = db.Column(db.String(30), nullable=False, default="password_reset")

    attempts = db.Column(db.Integer, default=0, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)

    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired()
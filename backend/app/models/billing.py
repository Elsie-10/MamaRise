import uuid
import secrets
from datetime import datetime
from enum import Enum

from app.extensions import db


def generate_uuid():
    return str(uuid.uuid4())


def generate_invite_code():
    """Short, human-typeable code - not a UUID, since an employer needs to
    read this aloud or paste it into a Slack message for their staff."""
    return secrets.token_hex(4).upper()  # e.g. "A1B2C3D4"


class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PENDING_PAYMENT = "pending_payment"
    CANCELLED = "cancelled"


class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    REMOVED = "removed"


class Subscription(db.Model):
    """One row per user. Created lazily with FREE/ACTIVE defaults on first
    touch, same pattern as NotificationPreference - keeps signup lean."""

    __tablename__ = "subscriptions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, unique=True, index=True
    )

    tier = db.Column(db.String(20), nullable=False, default=SubscriptionTier.FREE.value)
    status = db.Column(db.String(20), nullable=False, default=SubscriptionStatus.ACTIVE.value)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "tier": self.tier,
            "status": self.status,
            "updated_at": self.updated_at.isoformat(),
        }


class EmployerOrganization(db.Model):
    """One employer account can run one organization. admin_user_id is the
    employer-role user who created it and manages the roster."""

    __tablename__ = "employer_organizations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    admin_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, unique=True, index=True
    )

    name = db.Column(db.String(255), nullable=False)
    seat_limit = db.Column(db.Integer, nullable=False, default=25)
    invite_code = db.Column(db.String(20), nullable=False, unique=True, index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    enrollments = db.relationship(
        "EmployerEnrollment", backref="organization", cascade="all, delete-orphan", lazy="dynamic"
    )

    def active_seat_count(self) -> int:
        return self.enrollments.filter_by(status=EnrollmentStatus.ACTIVE.value).count()

    def to_dict(self, include_roster=False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "seat_limit": self.seat_limit,
            "invite_code": self.invite_code,
            "active_seat_count": self.active_seat_count(),
            "created_at": self.created_at.isoformat(),
        }
        return data


class EmployerEnrollment(db.Model):
    """Links a mother to an employer org. Deliberately thin - no wellbeing
    data, no per-mother identifying stats surfaced through this model or
    anything that reads it. Aggregate-only stats are computed separately
    in the billing service, never joined back to a mother's name here."""

    __tablename__ = "employer_enrollments"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(
        db.String(36), db.ForeignKey("employer_organizations.id"), nullable=False, index=True
    )
    mother_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )

    status = db.Column(db.String(20), nullable=False, default=EnrollmentStatus.ACTIVE.value)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("organization_id", "mother_user_id", name="uq_org_mother"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "status": self.status,
            "enrolled_at": self.enrolled_at.isoformat(),
        }
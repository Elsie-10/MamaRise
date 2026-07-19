import uuid
from datetime import datetime
from enum import Enum

from app.extensions import db


def generate_uuid():
    return str(uuid.uuid4())


class MilestoneType(str, Enum):
    PEDIATRIC_CHECKUP = "pediatric_checkup"
    FAMILY_PLANNING = "family_planning"
    POSTPARTUM_CHECKUP = "postpartum_checkup"
    VACCINATION = "vaccination"
    OTHER = "other"


class Milestone(db.Model):
    """A single entry on the vertical timeline - pediatric check-ups,
    family planning consults, etc. Deliberately simple/flat: no recurrence
    engine, no calendar sync in this phase. Each occurrence is its own row."""

    __tablename__ = "milestones"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(30), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "due_date": self.due_date.isoformat(),
            "notes": self.notes,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat(),
        }


class NotificationPreference(db.Model):
    """One row per user. Created lazily (on first read or first update)
    rather than at registration - keeps signup lean and this stays purely
    opt-in state."""

    __tablename__ = "notification_preferences"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, unique=True, index=True
    )

    daily_wellbeing_nudges = db.Column(db.Boolean, default=True, nullable=False)
    vitamin_reminders = db.Column(db.Boolean, default=True, nullable=False)
    milestone_reminders = db.Column(db.Boolean, default=True, nullable=False)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "daily_wellbeing_nudges": self.daily_wellbeing_nudges,
            "vitamin_reminders": self.vitamin_reminders,
            "milestone_reminders": self.milestone_reminders,
            "updated_at": self.updated_at.isoformat(),
        }
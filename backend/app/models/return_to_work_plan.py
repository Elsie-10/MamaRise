import uuid
from datetime import datetime, date
from enum import Enum

from app.extensions import db


def generate_uuid():
    return str(uuid.uuid4())


class WorkType(str, Enum):
    REMOTE = "remote"
    CORPORATE = "corporate"
    HYBRID = "hybrid"
    GIG = "gig"
    INFORMAL = "informal"  # e.g. trading, farming - matches admin's Kenya-specific scope
    OTHER = "other"


class TaskCategory(str, Enum):
    LOGISTICS = "logistics"
    CAREER = "career"
    WELLBEING = "wellbeing"


class ReturnToWorkPlan(db.Model):
    """One active plan per mother. Holds the return date that both the
    Planner's 'weeks remaining' and the Dashboard's postpartum indicator
    are computed from."""

    __tablename__ = "return_to_work_plans"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    work_type = db.Column(db.String(20), nullable=False)
    return_date = db.Column(db.Date, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    checklist_items = db.relationship(
        "ChecklistItem", backref="plan", cascade="all, delete-orphan", lazy="dynamic"
    )
    childcare_arrangement = db.relationship(
        "ChildcareArrangement",
        backref="plan",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def weeks_remaining(self) -> int:
        """Never negative - once the return date passes, this reads 0 rather
        than confusing the frontend with a negative countdown."""
        today = date.today()
        if self.return_date <= today:
            return 0
        delta_days = (self.return_date - today).days
        return delta_days // 7

    def to_dict(self, include_relations=True) -> dict:
        data = {
            "id": self.id,
            "work_type": self.work_type,
            "return_date": self.return_date.isoformat(),
            "weeks_remaining": self.weeks_remaining(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_relations:
            data["checklist_items"] = [
                item.to_dict() for item in self.checklist_items.order_by(ChecklistItem.position)
            ]
            data["childcare_arrangement"] = (
                self.childcare_arrangement.to_dict() if self.childcare_arrangement else None
            )
        return data


class ChecklistItem(db.Model):
    __tablename__ = "checklist_items"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    plan_id = db.Column(
        db.String(36), db.ForeignKey("return_to_work_plans.id"), nullable=False, index=True
    )

    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)
    is_custom = db.Column(db.Boolean, default=False, nullable=False)  # user-added vs. auto-generated
    position = db.Column(db.Integer, default=0, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "is_completed": self.is_completed,
            "is_custom": self.is_custom,
            "position": self.position,
        }


class ChildcareArrangement(db.Model):
    __tablename__ = "childcare_arrangements"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    plan_id = db.Column(
        db.String(36),
        db.ForeignKey("return_to_work_plans.id"),
        nullable=False,
        unique=True,  # one arrangement per plan
        index=True,
    )

    primary_caregiver = db.Column(db.String(255), nullable=True)
    backup_plan = db.Column(db.Text, nullable=True)
    commute_notes = db.Column(db.Text, nullable=True)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "primary_caregiver": self.primary_caregiver,
            "backup_plan": self.backup_plan,
            "commute_notes": self.commute_notes,
            "updated_at": self.updated_at.isoformat(),
        }
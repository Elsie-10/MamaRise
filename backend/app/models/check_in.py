import uuid
from datetime import datetime, date

from app.extensions import db


def generate_uuid():
    return str(uuid.uuid4())


class CheckIn(db.Model):
    """A single wellbeing check-in. Deliberately private to the mother who
    created it - no employer_visible flag, no aggregation hooks. If that
    changes later it should be a new, explicit read path, not a field added
    here that widens access to something already stored as personal."""

    __tablename__ = "check_ins"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    # 1-5 scale for both - simple sliders on the frontend map directly to this
    mood_score = db.Column(db.Integer, nullable=False)
    stress_score = db.Column(db.Integer, nullable=False)
    sleep_hours = db.Column(db.Float, nullable=True)

    note = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "mood_score": self.mood_score,
            "stress_score": self.stress_score,
            "sleep_hours": self.sleep_hours,
            "note": self.note,
            "created_at": self.created_at.isoformat(),
        }
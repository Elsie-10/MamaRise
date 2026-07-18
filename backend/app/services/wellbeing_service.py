from datetime import date, datetime, timedelta

from app.models.check_in import CheckIn

# High-stress threshold that triggers surfacing the breathing exercise
# proactively on the frontend (e.g. right after a check-in is logged).
# This is a gentle nudge, NOT a clinical screening signal - deliberately
# no escalation/referral logic here per the product's Phase 1 scope.
STRESS_NUDGE_THRESHOLD = 4  # on a 1-5 scale

BREATHING_EXERCISE = {
    "title": "2-Minute Guided Breathing",
    "duration_seconds": 120,
    "steps": [
        {"instruction": "Breathe in slowly through your nose", "seconds": 4},
        {"instruction": "Hold gently", "seconds": 4},
        {"instruction": "Breathe out slowly through your mouth", "seconds": 6},
        {"instruction": "Pause before your next breath", "seconds": 2},
    ],
    "repeat": 8,  # roughly fills the 2-minute duration
}


def should_suggest_breathing_exercise(stress_score: int) -> bool:
    return stress_score >= STRESS_NUDGE_THRESHOLD


def get_today_checkin(user_id: str):
    today_start = datetime.combine(date.today(), datetime.min.time())
    return (
        CheckIn.query.filter(CheckIn.user_id == user_id, CheckIn.created_at >= today_start)
        .order_by(CheckIn.created_at.desc())
        .first()
    )


def get_checkin_summary(user_id: str, days: int = 7) -> dict:
    """Lightweight trend used by the Dashboard - averages over the last N
    days. Returns None values if there's no data yet rather than erroring,
    so the Dashboard can render an empty state cleanly."""
    since = datetime.utcnow() - timedelta(days=days)
    recent = CheckIn.query.filter(CheckIn.user_id == user_id, CheckIn.created_at >= since).all()

    if not recent:
        return {
            "period_days": days,
            "checkin_count": 0,
            "average_mood": None,
            "average_stress": None,
            "average_sleep_hours": None,
        }

    sleep_values = [c.sleep_hours for c in recent if c.sleep_hours is not None]

    return {
        "period_days": days,
        "checkin_count": len(recent),
        "average_mood": round(sum(c.mood_score for c in recent) / len(recent), 1),
        "average_stress": round(sum(c.stress_score for c in recent) / len(recent), 1),
        "average_sleep_hours": (
            round(sum(sleep_values) / len(sleep_values), 1) if sleep_values else None
        ),
    }
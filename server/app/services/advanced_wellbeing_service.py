from datetime import datetime, timedelta

from app.models.check_in import CheckIn


TREND_THRESHOLDS = {
    "mood": 0.3,
    "stress": 0.3,
    "sleep": 0.5,
}


def _calculate_average(records, attribute):
    values = [
        getattr(record, attribute)
        for record in records
        if getattr(record, attribute) is not None
    ]

    if not values:
        return None

    return round(sum(values) / len(values), 1)


def _classify_trend(older_records, newer_records, attribute, threshold):
    older_average = _calculate_average(older_records, attribute)
    newer_average = _calculate_average(newer_records, attribute)

    if (
        older_average is None
        or newer_average is None
        or len(older_records) < 2
        or len(newer_records) < 2
    ):
        return {
            "direction": "insufficient_data",
            "change": None,
        }

    change = round(newer_average - older_average, 1)

    if abs(change) < threshold:
        direction = "stable"
    elif attribute == "stress_score":
        direction = "improving" if change < 0 else "declining"
    else:
        direction = "improving" if change > 0 else "declining"

    return {
        "direction": direction,
        "change": change,
    }


def get_advanced_wellbeing_insights(user_id: str, days: int = 30) -> dict:
    """
    Generate personal wellbeing insights from one mother's check-ins.

    These observations describe recorded patterns. They are not
    clinical assessments or medical diagnoses.
    """
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)
    midpoint = period_start + timedelta(days=days / 2)

    records = (
        CheckIn.query.filter(
            CheckIn.user_id == user_id,
            CheckIn.created_at >= period_start,
            CheckIn.created_at <= period_end,
        )
        .order_by(CheckIn.created_at.asc())
        .all()
    )

    older_records = [
        record for record in records
        if record.created_at < midpoint
    ]

    newer_records = [
        record for record in records
        if record.created_at >= midpoint
    ]

    average_mood = _calculate_average(records, "mood_score")
    average_stress = _calculate_average(records, "stress_score")
    average_sleep = _calculate_average(records, "sleep_hours")

    checkin_days = len({
        record.created_at.date()
        for record in records
    })

    consistency = round((checkin_days / days) * 100, 1)

    trends = {
        "mood": _classify_trend(
            older_records,
            newer_records,
            "mood_score",
            TREND_THRESHOLDS["mood"],
        ),
        "stress": _classify_trend(
            older_records,
            newer_records,
            "stress_score",
            TREND_THRESHOLDS["stress"],
        ),
        "sleep": _classify_trend(
            older_records,
            newer_records,
            "sleep_hours",
            TREND_THRESHOLDS["sleep"],
        ),
    }

    observations = []

    if not records:
        observations.append(
            "There is not enough check-in data yet. "
            "Regular check-ins will help reveal your personal patterns."
        )
    else:
        if trends["mood"]["direction"] == "improving":
            observations.append(
                "Your recorded mood scores have improved compared "
                "with the earlier part of this period."
            )
        elif trends["mood"]["direction"] == "declining":
            observations.append(
                "Your recorded mood scores have decreased compared "
                "with the earlier part of this period."
            )

        if trends["stress"]["direction"] == "improving":
            observations.append(
                "Your recorded stress scores have decreased "
                "compared with the earlier part of this period."
            )
        elif trends["stress"]["direction"] == "declining":
            observations.append(
                "Your recorded stress scores have increased "
                "compared with the earlier part of this period."
            )

        if trends["sleep"]["direction"] == "improving":
            observations.append(
                "Your recorded sleep duration has increased "
                "compared with the earlier part of this period."
            )
        elif trends["sleep"]["direction"] == "declining":
            observations.append(
                "Your recorded sleep duration has decreased "
                "compared with the earlier part of this period."
            )

        if checkin_days:
            observations.append(
                f"You recorded check-ins on {checkin_days} "
                f"out of {days} days in this period."
            )

        if len(observations) == 0:
            observations.append(
                "Your recorded wellbeing measures have not shown "
                "a clear change during this period."
            )

    return {
        "period_days": days,
        "checkin_count": len(records),
        "checkin_days": checkin_days,
        "consistency_percentage": consistency,
        "averages": {
            "mood": average_mood,
            "stress": average_stress,
            "sleep_hours": average_sleep,
        },
        "trends": trends,
        "observations": observations,
        "disclaimer": (
            "These insights describe patterns in your recorded "
            "check-ins. They are not medical advice or a diagnosis."
        ),
    }
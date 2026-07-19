from datetime import datetime, timedelta

from app.models.return_to_work_plan import ReturnToWorkPlan
from app.models.check_in import CheckIn
from app.models.milestone import Milestone


def _time_based_greeting() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    if hour < 17:
        return "Good afternoon"
    return "Good evening"


def build_dashboard(user) -> dict:
    """Pulls together the pieces for the Morning Greeting screen. Read-only -
    doesn't create or modify anything, so this stays safe to call as often
    as the frontend wants (e.g. every time the dashboard tab opens)."""

    greeting = f"{_time_based_greeting()}, {user.full_name.split(' ')[0]}"

    # Quick Check-In status - CheckIn only stores created_at (a timestamp),
    # not a separate date column, so "today" is a range filter on that.
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_end = today_start + timedelta(days=1)
    today_checkin = (
        CheckIn.query.filter(
            CheckIn.user_id == user.id,
            CheckIn.created_at >= today_start,
            CheckIn.created_at < today_end,
        )
        .order_by(CheckIn.created_at.desc())
        .first()
    )

    # Priority Glance - next upcoming milestone
    next_milestone = (
        Milestone.query.filter_by(user_id=user.id, is_completed=False)
        .filter(Milestone.due_date >= datetime.utcnow().date())
        .order_by(Milestone.due_date.asc())
        .first()
    )

    # Active Planner - top 3 incomplete tasks, in the order they were
    # generated/added (position field already carries that intent)
    plan = ReturnToWorkPlan.query.filter_by(user_id=user.id).first()
    top_tasks = []
    weeks_remaining = None
    if plan:
        weeks_remaining = plan.weeks_remaining()
        top_tasks = [
            item.to_dict()
            for item in plan.checklist_items.filter_by(is_completed=False)
            .order_by("position")
            .limit(3)
        ]

    return {
        "greeting": greeting,
        "has_checked_in_today": today_checkin is not None,
        "todays_checkin": today_checkin.to_dict() if today_checkin else None,
        "next_milestone": next_milestone.to_dict() if next_milestone else None,
        "return_to_work": {
            "has_plan": plan is not None,
            "weeks_remaining": weeks_remaining,
            "top_tasks": top_tasks,
        },
    }
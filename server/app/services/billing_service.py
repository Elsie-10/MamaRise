from app.models.return_to_work_plan import ReturnToWorkPlan
from app.models.billing import EmployerEnrollment, EnrollmentStatus
from app.models.user import User


def _planner_completion_percentage(user_id: str):
    """Returns None if the mother has no plan yet, so she isn't counted as
    '0% complete' in an average - that would be misleading for someone who
    simply hasn't started using the Planner."""
    plan = ReturnToWorkPlan.query.filter_by(user_id=user_id).first()
    if not plan:
        return None

    total = plan.checklist_items.count()
    if total == 0:
        return None

    completed = plan.checklist_items.filter_by(is_completed=True).count()
    return round((completed / total) * 100, 1)


def build_employer_stats(organization) -> dict:
    """AGGREGATE ONLY - no individual mother's identity or wellbeing data
    is returned here. Use build_employer_roster() below for the named
    per-mother view."""

    active_enrollments = organization.enrollments.filter_by(
        status=EnrollmentStatus.ACTIVE.value
    ).all()

    percentages = []
    for enrollment in active_enrollments:
        pct = _planner_completion_percentage(enrollment.mother_user_id)
        if pct is not None:
            percentages.append(pct)

    average_completion = round(sum(percentages) / len(percentages), 1) if percentages else None

    return {
        "enrolled_count": len(active_enrollments),
        "mothers_with_active_plan": len(percentages),
        "average_planner_completion_percentage": average_completion,
    }


def build_employer_roster(organization) -> list:
    """Named per-mother view: name and Planner completion percentage ONLY.

    HARD BOUNDARY - do not extend this to include anything from Wellbeing
    (mood, stress, sleep, check-in content) or any other private module.
    If a future requirement needs more employer-visible fields, treat that
    as a new, explicitly reviewed decision - not a quiet addition here."""

    active_enrollments = organization.enrollments.filter_by(
        status=EnrollmentStatus.ACTIVE.value
    ).order_by(EmployerEnrollment.enrolled_at.asc())

    roster = []
    for enrollment in active_enrollments:
        mother = User.query.get(enrollment.mother_user_id)
        roster.append(
            {
                "enrollment_id": enrollment.id,
                "mother_name": mother.full_name if mother else "Unknown",
                "enrolled_at": enrollment.enrolled_at.isoformat(),
                "planner_completion_percentage": _planner_completion_percentage(
                    enrollment.mother_user_id
                ),
            }
        )
    return roster
from app.extensions import db
from app.models.return_to_work_plan import ChecklistItem, TaskCategory, WorkType

# Each entry: (title, category). Kept as plain data so non-engineers on the
# team (or a future admin panel) could eventually tune this without touching
# route/service code.
BASE_TASKS = [
    ("Schedule your first pediatric check-up", TaskCategory.LOGISTICS.value),
    ("Confirm your return date with HR/manager", TaskCategory.CAREER.value),
    ("Do a 10-minute daily check-in with yourself", TaskCategory.WELLBEING.value),
]

WORK_TYPE_TASKS = {
    WorkType.REMOTE.value: [
        ("Test your home workspace setup", TaskCategory.LOGISTICS.value),
        ("Agree on updated working hours with your manager", TaskCategory.CAREER.value),
        ("Plan for pumping/feeding breaks during work hours", TaskCategory.WELLBEING.value),
    ],
    WorkType.CORPORATE.value: [
        ("Arrange commute and drop-off logistics", TaskCategory.LOGISTICS.value),
        ("Schedule a re-onboarding meeting with HR", TaskCategory.CAREER.value),
        ("Confirm lactation room/breastfeeding policy at the office", TaskCategory.WELLBEING.value),
    ],
    WorkType.HYBRID.value: [
        ("Confirm which days you'll be in-office vs remote", TaskCategory.LOGISTICS.value),
        ("Align expectations with your manager on hybrid schedule", TaskCategory.CAREER.value),
        ("Plan childcare coverage separately for office days", TaskCategory.WELLBEING.value),
    ],
    WorkType.GIG.value: [
        ("Reconnect with clients/platforms about your availability", TaskCategory.LOGISTICS.value),
        ("Update your rates or availability calendar", TaskCategory.CAREER.value),
        ("Set a sustainable weekly workload target", TaskCategory.WELLBEING.value),
    ],
    WorkType.INFORMAL.value: [
        ("Arrange support for market/farm duties during transition", TaskCategory.LOGISTICS.value),
        ("Check in with trading/farming partners or suppliers", TaskCategory.CAREER.value),
        ("Build in rest days during the first weeks back", TaskCategory.WELLBEING.value),
    ],
    WorkType.OTHER.value: [],
}


def generate_checklist_for_plan(plan_id: str, work_type: str) -> None:
    """Creates the initial auto-generated checklist for a new plan. Called
    once at plan creation - later edits/completions happen through the
    checklist endpoints, not by regenerating this."""
    tasks = BASE_TASKS + WORK_TYPE_TASKS.get(work_type, [])

    for position, (title, category) in enumerate(tasks):
        item = ChecklistItem(
            plan_id=plan_id,
            title=title,
            category=category,
            is_custom=False,
            position=position,
        )
        db.session.add(item)

    db.session.commit()
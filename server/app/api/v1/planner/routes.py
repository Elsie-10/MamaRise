from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.extensions import db
from app.models.return_to_work_plan import (
    ReturnToWorkPlan,
    ChecklistItem,
    ChildcareArrangement,
)
from app.api.v1.planner.schemas import (
    CreatePlanSchema,
    UpdatePlanSchema,
    CreateChecklistItemSchema,
    UpdateChecklistItemSchema,
    ChildcareArrangementSchema,
)
from app.services.planner_service import generate_checklist_for_plan
from app.utils.responses import success_response, error_response

planner_bp = Blueprint("planner", __name__, url_prefix="/api/v1/planner")

create_plan_schema = CreatePlanSchema()
update_plan_schema = UpdatePlanSchema()
create_item_schema = CreateChecklistItemSchema()
update_item_schema = UpdateChecklistItemSchema()
childcare_schema = ChildcareArrangementSchema()


def _get_owned_plan_or_none(plan_id: str, user_id: str):
    return ReturnToWorkPlan.query.filter_by(id=plan_id, user_id=user_id).first()


@planner_bp.route("/plans", methods=["POST"])
@jwt_required()
def create_plan():
    """One active plan per user - creating a new one replaces any existing
    plan (cascade delete removes its old checklist/childcare data too)."""
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    try:
        data = create_plan_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid plan data.", 422, err.messages)

    existing_plan = ReturnToWorkPlan.query.filter_by(user_id=user_id).first()
    if existing_plan:
        db.session.delete(existing_plan)
        db.session.commit()

    plan = ReturnToWorkPlan(
        user_id=user_id,
        work_type=data["work_type"],
        return_date=data["return_date"],
    )
    db.session.add(plan)
    db.session.commit()

    generate_checklist_for_plan(plan.id, plan.work_type)
    db.session.refresh(plan)

    return success_response(plan.to_dict(), 201)


@planner_bp.route("/plans/me", methods=["GET"])
@jwt_required()
def get_my_plan():
    user_id = get_jwt_identity()
    plan = ReturnToWorkPlan.query.filter_by(user_id=user_id).first()

    if not plan:
        return error_response("NOT_FOUND", "No return-to-work plan found for this user.", 404)

    return success_response(plan.to_dict())


@planner_bp.route("/plans/<plan_id>", methods=["PATCH"])
@jwt_required()
def update_plan(plan_id):
    """Updates work_type/return_date only. Does NOT regenerate the
    checklist automatically - avoids silently wiping a user's progress.
    If work_type changes significantly, that's a product decision to
    surface explicitly in the UI, not something the backend should do
    unprompted."""
    user_id = get_jwt_identity()
    plan = _get_owned_plan_or_none(plan_id, user_id)

    if not plan:
        return error_response("NOT_FOUND", "Plan not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = update_plan_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid plan data.", 422, err.messages)

    if "work_type" in data:
        plan.work_type = data["work_type"]
    if "return_date" in data:
        plan.return_date = data["return_date"]

    db.session.commit()
    return success_response(plan.to_dict())


@planner_bp.route("/plans/<plan_id>", methods=["DELETE"])
@jwt_required()
def delete_plan(plan_id):
    user_id = get_jwt_identity()
    plan = _get_owned_plan_or_none(plan_id, user_id)

    if not plan:
        return error_response("NOT_FOUND", "Plan not found.", 404)

    db.session.delete(plan)
    db.session.commit()
    return success_response({"message": "Plan deleted."})


@planner_bp.route("/plans/<plan_id>/checklist", methods=["POST"])
@jwt_required()
def add_checklist_item(plan_id):
    user_id = get_jwt_identity()
    plan = _get_owned_plan_or_none(plan_id, user_id)

    if not plan:
        return error_response("NOT_FOUND", "Plan not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = create_item_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid checklist item.", 422, err.messages)

    next_position = plan.checklist_items.count()
    item = ChecklistItem(
        plan_id=plan.id,
        title=data["title"],
        category=data["category"],
        is_custom=True,
        position=next_position,
    )
    db.session.add(item)
    db.session.commit()

    return success_response(item.to_dict(), 201)


@planner_bp.route("/checklist/<item_id>", methods=["PATCH"])
@jwt_required()
def update_checklist_item(item_id):
    """Covers both 'toggle complete' and 'edit title/category' - the
    frontend can send just is_completed for the common case (tapping a
    checkbox) without needing a separate endpoint."""
    user_id = get_jwt_identity()

    item = (
        ChecklistItem.query.join(ReturnToWorkPlan)
        .filter(ChecklistItem.id == item_id, ReturnToWorkPlan.user_id == user_id)
        .first()
    )
    if not item:
        return error_response("NOT_FOUND", "Checklist item not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = update_item_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid update.", 422, err.messages)

    if "title" in data:
        item.title = data["title"]
    if "category" in data:
        item.category = data["category"]
    if "is_completed" in data:
        item.is_completed = data["is_completed"]

    db.session.commit()
    return success_response(item.to_dict())


@planner_bp.route("/checklist/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_checklist_item(item_id):
    user_id = get_jwt_identity()

    item = (
        ChecklistItem.query.join(ReturnToWorkPlan)
        .filter(ChecklistItem.id == item_id, ReturnToWorkPlan.user_id == user_id)
        .first()
    )
    if not item:
        return error_response("NOT_FOUND", "Checklist item not found.", 404)

    db.session.delete(item)
    db.session.commit()
    return success_response({"message": "Checklist item deleted."})



@planner_bp.route("/plans/<plan_id>/childcare", methods=["PUT"])
@jwt_required()
def upsert_childcare(plan_id):
    user_id = get_jwt_identity()
    plan = _get_owned_plan_or_none(plan_id, user_id)

    if not plan:
        return error_response("NOT_FOUND", "Plan not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = childcare_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid childcare details.", 422, err.messages)

    arrangement = plan.childcare_arrangement
    if not arrangement:
        arrangement = ChildcareArrangement(plan_id=plan.id)
        db.session.add(arrangement)

    if "primary_caregiver" in data:
        arrangement.primary_caregiver = data["primary_caregiver"]
    if "backup_plan" in data:
        arrangement.backup_plan = data["backup_plan"]
    if "commute_notes" in data:
        arrangement.commute_notes = data["commute_notes"]

    db.session.commit()
    return success_response(arrangement.to_dict())
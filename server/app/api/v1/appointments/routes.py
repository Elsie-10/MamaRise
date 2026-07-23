from datetime import date, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.extensions import db
from app.models.milestone import Milestone, NotificationPreference
from app.api.v1.appointments.schemas import (
    CreateMilestoneSchema,
    UpdateMilestoneSchema,
    NotificationPreferenceSchema,
)
from app.utils.responses import success_response, error_response

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/v1/appointments")

create_milestone_schema = CreateMilestoneSchema()
update_milestone_schema = UpdateMilestoneSchema()
notification_pref_schema = NotificationPreferenceSchema()


def _get_owned_milestone_or_none(milestone_id: str, user_id: str):
    return Milestone.query.filter_by(id=milestone_id, user_id=user_id).first()


def _get_or_create_preferences(user_id: str) -> NotificationPreference:
    """Preferences are created lazily on first touch, with defaults, rather
    than at registration - keeps the User model and signup flow lean."""
    prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.session.add(prefs)
        db.session.commit()
    return prefs


@appointments_bp.route("/milestones", methods=["POST"])
@jwt_required()
def create_milestone():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    try:
        data = create_milestone_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid milestone data.", 422, err.messages)

    milestone = Milestone(
        user_id=user_id,
        title=data["title"],
        type=data["type"],
        due_date=data["due_date"],
        notes=data.get("notes"),
    )
    db.session.add(milestone)
    db.session.commit()

    return success_response(milestone.to_dict(), 201)


@appointments_bp.route("/milestones", methods=["GET"])
@jwt_required()
def list_milestones():
    """Returns the vertical timeline, soonest first. ?include_completed=true
    to also show past/done items - defaults to hiding them so the timeline
    stays focused on what's ahead, matching the 'Looking Ahead' framing."""
    user_id = get_jwt_identity()
    include_completed = request.args.get("include_completed", "false").lower() == "true"

    query = Milestone.query.filter_by(user_id=user_id)
    if not include_completed:
        query = query.filter_by(is_completed=False)

    milestones = query.order_by(Milestone.due_date.asc()).all()

    return success_response({"items": [m.to_dict() for m in milestones]})


@appointments_bp.route("/milestones/upcoming", methods=["GET"])
@jwt_required()
def get_upcoming_milestone():
    """Single next milestone - built for the Dashboard's 'Priority Glance'
    card, so the frontend doesn't have to fetch the full list and pick
    the first one itself."""
    user_id = get_jwt_identity()
    today = date.today()

    milestone = (
        Milestone.query.filter_by(user_id=user_id, is_completed=False)
        .filter(Milestone.due_date >= today)
        .order_by(Milestone.due_date.asc())
        .first()
    )

    return success_response({"milestone": milestone.to_dict() if milestone else None})


@appointments_bp.route("/milestones/<milestone_id>", methods=["PATCH"])
@jwt_required()
def update_milestone(milestone_id):
    user_id = get_jwt_identity()
    milestone = _get_owned_milestone_or_none(milestone_id, user_id)

    if not milestone:
        return error_response("NOT_FOUND", "Milestone not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = update_milestone_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid update.", 422, err.messages)

    for field in ("title", "type", "due_date", "notes", "is_completed"):
        if field in data:
            setattr(milestone, field, data[field])

    db.session.commit()
    return success_response(milestone.to_dict())


@appointments_bp.route("/milestones/<milestone_id>", methods=["DELETE"])
@jwt_required()
def delete_milestone(milestone_id):
    user_id = get_jwt_identity()
    milestone = _get_owned_milestone_or_none(milestone_id, user_id)

    if not milestone:
        return error_response("NOT_FOUND", "Milestone not found.", 404)

    db.session.delete(milestone)
    db.session.commit()
    return success_response({"message": "Milestone deleted."})


@appointments_bp.route("/notification-preferences", methods=["GET"])
@jwt_required()
def get_notification_preferences():
    user_id = get_jwt_identity()
    prefs = _get_or_create_preferences(user_id)
    return success_response(prefs.to_dict())


@appointments_bp.route("/notification-preferences", methods=["PATCH"])
@jwt_required()
def update_notification_preferences():
    user_id = get_jwt_identity()
    prefs = _get_or_create_preferences(user_id)

    payload = request.get_json(silent=True) or {}
    try:
        data = notification_pref_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid preferences.", 422, err.messages)

    for field in ("daily_wellbeing_nudges", "vitamin_reminders", "milestone_reminders"):
        if field in data:
            setattr(prefs, field, data[field])

    db.session.commit()
    return success_response(prefs.to_dict())
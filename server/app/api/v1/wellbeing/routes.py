from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.extensions import db
from app.models.check_in import CheckIn
from app.api.v1.wellbeing.schemas import CreateCheckInSchema, ListCheckInsQuerySchema
from app.services.wellbeing_service import (
    get_today_checkin,
    get_checkin_summary,
    should_suggest_breathing_exercise,
    BREATHING_EXERCISE,
)
from app.utils.responses import success_response, error_response

wellbeing_bp = Blueprint("wellbeing", __name__, url_prefix="/api/v1/wellbeing")

create_checkin_schema = CreateCheckInSchema()
list_query_schema = ListCheckInsQuerySchema()


@wellbeing_bp.route("/checkins", methods=["POST"])
@jwt_required()
def create_checkin():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    try:
        data = create_checkin_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid check-in data.", 422, err.messages)

    checkin = CheckIn(
        user_id=user_id,
        mood_score=data["mood_score"],
        stress_score=data["stress_score"],
        sleep_hours=data.get("sleep_hours"),
        note=data.get("note"),
    )
    db.session.add(checkin)
    db.session.commit()

    response_data = checkin.to_dict()
    response_data["suggest_breathing_exercise"] = should_suggest_breathing_exercise(
        data["stress_score"]
    )

    return success_response(response_data, 201)


@wellbeing_bp.route("/checkins", methods=["GET"])
@jwt_required()
def list_checkins():
    """Paginated history - check-in count only grows over time, so this
    never returns everything at once."""
    user_id = get_jwt_identity()

    try:
        query_args = list_query_schema.load(request.args)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid query parameters.", 422, err.messages)

    pagination = (
        CheckIn.query.filter_by(user_id=user_id)
        .order_by(CheckIn.created_at.desc())
        .paginate(page=query_args["page"], per_page=query_args["per_page"], error_out=False)
    )

    return success_response(
        {
            "items": [c.to_dict() for c in pagination.items],
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
        }
    )


@wellbeing_bp.route("/checkins/today", methods=["GET"])
@jwt_required()
def get_today():
    """Powers the Dashboard's 'have you checked in today' prompt without
    the frontend needing to fetch and filter the full history itself."""
    user_id = get_jwt_identity()
    checkin = get_today_checkin(user_id)

    return success_response(
        {
            "has_checked_in_today": checkin is not None,
            "checkin": checkin.to_dict() if checkin else None,
        }
    )


@wellbeing_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    """7-day rolling average - for the Dashboard's vitals cards and any
    future trend view. Extend `days` via query param if needed later."""
    user_id = get_jwt_identity()
    days = request.args.get("days", default=7, type=int)
    days = max(1, min(days, 90))  # sane bounds regardless of what's passed in

    return success_response(get_checkin_summary(user_id, days))


@wellbeing_bp.route("/breathing-exercise", methods=["GET"])
@jwt_required()
def get_breathing_exercise():
    """Static content, not user data - same response for everyone. Kept
    behind auth anyway since it's still an app resource, not public API."""
    return success_response(BREATHING_EXERCISE)
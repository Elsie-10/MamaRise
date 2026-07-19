from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.services.dashboard_service import build_dashboard
from app.utils.responses import success_response, error_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/v1/dashboard")


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return error_response("NOT_FOUND", "User not found.", 404)

    return success_response(build_dashboard(user))
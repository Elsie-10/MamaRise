from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request, get_jwt_identity

from app.utils.responses import error_response

from app.extensions import db
from app.models.user import User
from app.models.billing import Subscription
from app.services.entitlement_service import has_feature_access


def role_required(*allowed_roles):
    """Usage: @role_required('mother', 'admin') above any route function.
    Must sit below @jwt_required-equivalent - this calls verify_jwt_in_request itself."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                return error_response(
                    "FORBIDDEN",
                    "You do not have permission to access this resource.",
                    403,
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator

def feature_required(feature: str):
    """Require an authenticated user to have access to a specific feature."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()

            user_id = get_jwt_identity()
            user = db.session.get(User, user_id)

            if not user:
                return error_response(
                    "NOT_FOUND",
                    "User not found.",
                    404,
                )

            subscription = Subscription.query.filter_by(
                user_id=user_id
            ).first()

            if not has_feature_access(user, subscription, feature):
                return error_response(
                    "PREMIUM_REQUIRED",
                    "This feature requires an active Premium subscription.",
                    403,
                    {"feature": feature},
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator
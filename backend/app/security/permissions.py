from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.utils.responses import error_response


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
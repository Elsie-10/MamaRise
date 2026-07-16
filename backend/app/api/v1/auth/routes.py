from datetime import datetime

from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError

from app.extensions import db, limiter
from app.models.user import User, TokenBlocklist
from app.api.v1.auth.schemas import RegisterSchema, LoginSchema
from app.utils.responses import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

register_schema = RegisterSchema()
login_schema = LoginSchema()

def _normalize_phone(phone: str) -> str:
    """Stores every number in +254XXXXXXXXX format regardless of how it was typed."""
    phone = phone.strip().replace(" ", "")
    if phone.startswith("0"):
        return "+254" + phone[1:]
    if phone.startswith("254"):
        return "+" + phone
    return phone  

def _issue_token_pair(user: User):
    """Access token carries role as a claim so role_required() never hits the DB.
    Refresh token stays minimal - just identity."""
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=user.id, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=user.id, additional_claims=additional_claims)
    return access_token, refresh_token


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per hour")  # slows credential-stuffing / bulk fake-account creation
def register():
    payload = request.get_json(silent=True) or {}

    try:
        data = register_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid registration data.", 422, err.messages)

    if User.query.filter_by(email=data["email"].lower()).first():
        # Same generic message whether it's a duplicate email or anything else -
        # avoids confirming to an attacker which emails are already registered.
        return error_response(
            "REGISTRATION_FAILED", "Unable to create account with the provided details.", 409
        )
    
    normalized_phone = _normalize_phone(data["phone_number"])

    if User.query.filter_by(email=data["email"].lower()).first() or \
       User.query.filter_by(phone_number=normalized_phone).first():
        return error_response(
            "REGISTRATION_FAILED", "Unable to create account with the provided details.", 409
        )

    user = User(
        email=data["email"].lower(),
        phone_number=normalized_phone,
        full_name=data["full_name"],
        role=data["role"],
        consent_given_at=datetime.utcnow(),
        consent_version=data["consent_version"],
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    access_token, refresh_token = _issue_token_pair(user)

    return success_response(
        {
            "user": user.to_public_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        201,
    )


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per 15 minutes")  # throttles brute force independent of per-account lockout
def login():
    payload = request.get_json(silent=True) or {}

    try:
        data = login_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid login data.", 422, err.messages)

    user = User.query.filter_by(email=data["email"].lower()).first()

    # Identical generic error for "no such user" and "wrong password" -
    # prevents email enumeration via the login endpoint.
    generic_error = lambda: error_response("INVALID_CREDENTIALS", "Incorrect email or password.", 401)

    if not user:
        return generic_error()

    if user.is_locked():
        return error_response(
            "ACCOUNT_LOCKED",
            f"Account temporarily locked due to repeated failed attempts. "
            f"Try again after {current_app.config['ACCOUNT_LOCKOUT_MINUTES']} minutes.",
            423,
        )

    if not user.is_active:
        return error_response("ACCOUNT_DISABLED", "This account has been disabled.", 403)

    if not user.verify_password(data["password"]):
        user.register_failed_login(
            current_app.config["MAX_FAILED_LOGIN_ATTEMPTS"],
            current_app.config["ACCOUNT_LOCKOUT_MINUTES"],
        )
        db.session.commit()
        return generic_error()

    user.reset_login_attempts()
    db.session.commit()

    access_token, refresh_token = _issue_token_pair(user)

    return success_response(
        {
            "user": user.to_public_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh token rotation: the old refresh token is revoked the moment
    it's used, and a brand new pair is issued. If a stolen refresh token is
    ever replayed after the legitimate one was used, it's already dead."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return error_response("UNAUTHORIZED", "Account no longer valid.", 401)

    old_jti = get_jwt()["jti"]
    old_exp = datetime.utcfromtimestamp(get_jwt()["exp"])
    db.session.add(
        TokenBlocklist(jti=old_jti, token_type="refresh", user_id=user.id, expires_at=old_exp)
    )
    db.session.commit()

    access_token, refresh_token = _issue_token_pair(user)
    return success_response({"access_token": access_token, "refresh_token": refresh_token})


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Revokes the access token presented. Frontend should call this with
    the refresh token too (via a second call or a combined endpoint) to
    fully kill the session rather than just discarding tokens client-side."""
    jwt_payload = get_jwt()
    jti = jwt_payload["jti"]
    token_type = jwt_payload["type"]
    exp = datetime.utcfromtimestamp(jwt_payload["exp"])
    user_id = get_jwt_identity()

    db.session.add(
        TokenBlocklist(jti=jti, token_type=token_type, user_id=user_id, expires_at=exp)
    )
    db.session.commit()

    return success_response({"message": "Logged out successfully."})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found.", 404)
    return success_response(user.to_public_dict())
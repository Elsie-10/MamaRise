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
from app.api.v1.auth.schemas import (
    RegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    VerifyResetCodeSchema,
    CompletePasswordResetSchema,
    UpdateProfileSchema,
)
from app.services.otp_service import (
    create_otp_for_user,
    invalidate_otp,
    verify_reset_code,
    find_valid_reset_token,
)
from app.services.sms_service import sms_service
from app.utils.responses import success_response, error_response

from app.services.notification_service import notification_service

from sqlalchemy import update

from app.models.otp import OtpCode

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

register_schema = RegisterSchema()
login_schema = LoginSchema()
forgot_password_schema = ForgotPasswordSchema()
verify_reset_code_schema = VerifyResetCodeSchema()
complete_password_reset_schema = CompletePasswordResetSchema()
update_profile_schema = UpdateProfileSchema()


def _issue_token_pair(user: User):
    """Issue access and refresh tokens with role and session version claims."""
    additional_claims = {
        "role": user.role,
        "token_version": user.token_version,
    }

    access_token = create_access_token(
        identity=user.id,
        additional_claims=additional_claims,
    )

    refresh_token = create_refresh_token(
        identity=user.id,
        additional_claims=additional_claims,
    )

    return access_token, refresh_token


def _normalize_phone(phone: str) -> str:
    """Stores every number in +254XXXXXXXXX format regardless of how it was typed."""
    phone = phone.strip().replace(" ", "")
    if phone.startswith("0"):
        return "+254" + phone[1:]
    if phone.startswith("254"):
        return "+" + phone
    return phone  # already +254...


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per hour")  # slows credential-stuffing / bulk fake-account creation
def register():
    payload = request.get_json(silent=True) or {}

    try:
        data = register_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid registration data.", 422, err.messages)

    normalized_phone = _normalize_phone(data["phone_number"])

    existing = User.query.filter(
        (User.email == data["email"].lower()) | (User.phone_number == normalized_phone)
    ).first()
    if existing:
        # Same generic message whether it's a duplicate email, duplicate phone, or
        # anything else - avoids confirming to an attacker which are already registered.
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


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_current_user():
    """Lets a user set/update profile fields that weren't required at
    signup - currently full_name and baby_birth_date. This is where the
    postpartum-week indicator on the Dashboard gets its data from."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error_response("NOT_FOUND", "User not found.", 404)

    payload = request.get_json(silent=True) or {}
    try:
        data = update_profile_schema.load(payload, partial=True)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid profile update.", 422, err.messages)

    if "full_name" in data:
        user.full_name = data["full_name"]
    if "baby_birth_date" in data:
        user.baby_birth_date = data["baby_birth_date"]

    db.session.commit()
    return success_response(user.to_public_dict())


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("3 per 15 minutes")
def forgot_password():
    payload = request.get_json(silent=True) or {}

    try:
        data = forgot_password_schema.load(payload)
    except ValidationError as err:
        return error_response(
            "VALIDATION_ERROR",
            "Invalid recovery details.",
            422,
            err.messages,
        )

    phone = data.get("phone_number")
    email = data.get("email")

    if phone:
        contact = _normalize_phone(phone)
        user = User.query.filter_by(phone_number=contact).first()
    else:
        contact = email.strip().lower()
        user = User.query.filter_by(email=contact).first()

    generic_message = {
        "message": (
            "If an account is registered with those details, "
            "a verification code has been sent."
        )
    }

    if not user or not user.is_active:
        return success_response(generic_message)

    raw_code, otp_id = create_otp_for_user(
        user.id,
        purpose="password_reset",
    )

    if phone:
        delivered = sms_service.send(
            contact,
            (
                f"Your MamaRise password reset code is {raw_code}. "
                f"It expires in {current_app.config.get('OTP_EXPIRY_MINUTES', 10)} "
                "minutes. Never share this code with anyone."
            ),
        )
    else:
        delivered = notification_service.send_password_reset_email(
            contact,
            raw_code,
        )

    if not delivered:
        invalidate_otp(otp_id)

    return success_response(generic_message)

@auth_bp.route("/verify-reset-code", methods=["POST"])
@limiter.limit("5 per 15 minutes")
def verify_reset_code_route():
    try:
        data = verify_reset_code_schema.load(
            request.get_json(silent=True) or {}
        )
    except ValidationError as err:
        return error_response(
            "VALIDATION_ERROR",
            "Invalid verification data.",
            422,
            err.messages,
        )

    phone = data.get("phone_number")
    email = data.get("email")

    if phone:
        phone = _normalize_phone(phone)
        user = User.query.filter_by(phone_number=phone).first()
    else:
        email = email.strip().lower()
        user = User.query.filter_by(email=email).first()

    if not user or not user.is_active:
        return error_response(
            "INVALID_OR_EXPIRED_CODE",
            "The code is invalid or has expired.",
            400,
        )

    reset_token = verify_reset_code(
        user.id,
        data["otp_code"],
        purpose="password_reset",
    )

    if not reset_token:
        return error_response(
            "INVALID_OR_EXPIRED_CODE",
            "The code is invalid or has expired.",
            400,
        )

    return success_response({
        "reset_token": reset_token,
        "message": "Verification successful.",
    })


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per 15 minutes")
def reset_password():
    try:
        data = complete_password_reset_schema.load(
            request.get_json(silent=True) or {}
        )
    except ValidationError as err:
        return error_response(
            "VALIDATION_ERROR",
            "Invalid password reset data.",
            422,
            err.messages,
        )

    otp = find_valid_reset_token(data["reset_token"])

    if not otp:
        return error_response(
            "INVALID_OR_EXPIRED_TOKEN",
            "The password reset session is invalid or has expired.",
            400,
        )

    user = db.session.get(User, otp.user_id)

    if not user or not user.is_active:
        return error_response(
            "INVALID_OR_EXPIRED_TOKEN",
            "The password reset session is invalid or has expired.",
            400,
        )

    now = datetime.utcnow()

    # Atomically consume the reset token.
    # Only one concurrent request can successfully update this record.
    result = db.session.execute(
        update(OtpCode)
        .where(
            OtpCode.id == otp.id,
            OtpCode.reset_token_hash == otp.reset_token_hash,
            OtpCode.reset_token_expires_at > now,
        )
        .values(
            reset_token_hash=None,
            reset_token_expires_at=None,
        )
        .execution_options(synchronize_session=False)
    )

    if result.rowcount != 1:
        db.session.rollback()
        return error_response(
            "INVALID_OR_EXPIRED_TOKEN",
            "The password reset session is invalid or has expired.",
            400,
        )

    # Update the password in the same database transaction.
    user.set_password(data["new_password"])
    user.reset_login_attempts()
    user.token_version += 1

    db.session.commit()

    return success_response({
        "message": "Your password has been reset successfully.",
    })
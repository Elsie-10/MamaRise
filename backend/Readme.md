MAMARISE BACKEND - BABY BIRTH DATE FIELD - ALL FILES

This closes the gap flagged in the Dashboard PR: adds an optional
baby_birth_date field to User, a new PATCH /api/v1/auth/me endpoint to
set it after registration, and wires the resulting postpartum_weeks
count into both the user profile and the Dashboard response.

All three files below are EDITS to files you already have.

HOW TO USE:
Go top to bottom. For each section, REPLACE the whole file at that path
with what's between the markers.


EDIT: app/models/user.py  (REPLACE the whole file with this)
import uuid
from datetime import datetime, date, timedelta
from enum import Enum

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.extensions import db

ph = PasswordHasher()  # Argon2id, tuned defaults - stronger than bcrypt against GPU cracking


class UserRole(str, Enum):
    MOTHER = "mother"
    EMPLOYER = "employer"
    ADMIN = "admin"


def generate_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.MOTHER.value)

    # Optional - not required at signup since a mother may register before
    # she's ready to enter this, or the app may support pre-birth users
    # later. Powers the postpartum-week indicator on the Dashboard; null
    # simply means that indicator doesn't show yet.
    baby_birth_date = db.Column(db.Date, nullable=True)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)

    # Account lockout tracking - stops brute force without exposing why to the caller
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)

    # Consent trail - required for DPA compliance on health data collection
    consent_given_at = db.Column(db.DateTime, nullable=True)
    consent_version = db.Column(db.String(20), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_password(self, raw_password: str) -> None:
        self.password_hash = ph.hash(raw_password)

    def verify_password(self, raw_password: str) -> bool:
        try:
            valid = ph.verify(self.password_hash, raw_password)
        except VerifyMismatchError:
            return False
        # Argon2 params get stronger over time - rehash transparently if the
        # stored hash used older/weaker parameters than current config.
        if valid and ph.check_needs_rehash(self.password_hash):
            self.set_password(raw_password)
        return valid

    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > datetime.utcnow())

    def register_failed_login(self, max_attempts: int, lockout_minutes: int) -> None:
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)

    def reset_login_attempts(self) -> None:
        self.failed_login_attempts = 0
        self.locked_until = None

    def postpartum_weeks(self):
        """Returns None if no birth date is set yet - callers must handle
        that as 'don't show this indicator', not as zero."""
        if not self.baby_birth_date:
            return None
        if self.baby_birth_date > date.today():
            return None  # future date shouldn't happen, but never show negative weeks
        return (date.today() - self.baby_birth_date).days // 7

    def to_public_dict(self) -> dict:
        """Safe subset of fields for API responses - never leaks password_hash."""
        return {
            "id": self.id,
            "email": self.email,
            "phone_number": self.phone_number,
            "full_name": self.full_name,
            "role": self.role,
            "is_email_verified": self.is_email_verified,
            "baby_birth_date": self.baby_birth_date.isoformat() if self.baby_birth_date else None,
            "postpartum_weeks": self.postpartum_weeks(),
            "created_at": self.created_at.isoformat(),
        }


class TokenBlocklist(db.Model):
    """Revoked JWT identifiers - checked on every request so logout is real,
    not just 'client throws away the token and hopes'."""

    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True, unique=True)
    token_type = db.Column(db.String(10), nullable=False)  # "access" or "refresh"
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
END FILE: app/models/user.py


EDIT: app/api/v1/auth/schemas.py  (REPLACE the whole file with this)
import re
from datetime import date

from marshmallow import Schema, fields, validate, validates, ValidationError

PASSWORD_MIN_LENGTH = 10


def validate_password_strength(password: str) -> None:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValidationError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if not re.search(r"[A-Z]", password):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValidationError("Password must contain at least one number.")
    if not re.search(r"[^\w\s]", password):
        raise ValidationError("Password must contain at least one special character.")


def validate_kenyan_phone(phone: str) -> None:
    # Accepts 07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXXX / 254XXXXXXXXX
    pattern = r"^(?:\+254|254|0)(7|1)\d{8}$"
    if not re.match(pattern, phone):
        raise ValidationError(
            "Enter a valid Kenyan phone number, e.g. 0712345678 or +254712345678."
        )


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    phone_number = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    role = fields.Str(
        required=False,
        load_default="mother",
        validate=validate.OneOf(["mother", "employer"]),  # admin can never self-register
    )
    consent_given = fields.Bool(required=True)
    consent_version = fields.Str(required=True)

    @validates("password")
    def check_password(self, value, **kwargs):
        validate_password_strength(value)

    @validates("phone_number")
    def check_phone(self, value, **kwargs):
        validate_kenyan_phone(value)

    @validates("consent_given")
    def check_consent(self, value, **kwargs):
        if not value:
            raise ValidationError("Consent is required to create an account.")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class ForgotPasswordSchema(Schema):
    phone_number = fields.Str(required=True)

    @validates("phone_number")
    def check_phone(self, value, **kwargs):
        validate_kenyan_phone(value)


class ResetPasswordSchema(Schema):
    phone_number = fields.Str(required=True)
    otp_code = fields.Str(required=True, validate=validate.Length(equal=6))
    new_password = fields.Str(required=True, load_only=True)

    @validates("phone_number")
    def check_phone(self, value, **kwargs):
        validate_kenyan_phone(value)

    @validates("new_password")
    def check_password(self, value, **kwargs):
        validate_password_strength(value)


class RefreshSchema(Schema):
    # refresh token itself comes via Authorization header, this is left
    # empty intentionally as a placeholder if you later add device binding
    pass


class UpdateProfileSchema(Schema):
    full_name = fields.Str(required=False, validate=validate.Length(min=2, max=150))
    baby_birth_date = fields.Date(required=False, allow_none=True)

    @validates("baby_birth_date")
    def check_birth_date_not_future(self, value, **kwargs):
        if value and value > date.today():
            raise ValidationError("Birth date cannot be in the future.")
END FILE: app/api/v1/auth/schemas.py


EDIT: app/api/v1/auth/routes.py  (REPLACE the whole file with this)
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
    ResetPasswordSchema,
    UpdateProfileSchema,
)
from app.services.otp_service import create_otp_for_user, verify_otp
from app.services.sms_service import sms_service
from app.utils.responses import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

register_schema = RegisterSchema()
login_schema = LoginSchema()
forgot_password_schema = ForgotPasswordSchema()
reset_password_schema = ResetPasswordSchema()
update_profile_schema = UpdateProfileSchema()


def _issue_token_pair(user: User):
    """Access token carries role as a claim so role_required() never hits the DB.
    Refresh token stays minimal - just identity."""
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=user.id, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=user.id, additional_claims=additional_claims)
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
@limiter.limit("3 per 15 minutes")  # OTP requests are the easiest thing to abuse/spam
def forgot_password():
    payload = request.get_json(silent=True) or {}

    try:
        data = forgot_password_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid phone number.", 422, err.messages)

    normalized_phone = _normalize_phone(data["phone_number"])
    user = User.query.filter_by(phone_number=normalized_phone).first()

    # Always return the same success response whether or not the number is
    # registered - prevents attackers from using this endpoint to discover
    # which phone numbers have accounts.
    generic_message = {
        "message": "If this number is registered, a verification code has been sent."
    }

    if not user or not user.is_active:
        return success_response(generic_message)

    raw_code = create_otp_for_user(user.id, purpose="password_reset")
    sms_service.send(
        normalized_phone,
        f"Your MamaRise password reset code is {raw_code}. It expires in "
        f"{current_app.config.get('OTP_EXPIRY_MINUTES', 10)} minutes. "
        f"Never share this code with anyone.",
    )

    return success_response(generic_message)


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per 15 minutes")  # throttles OTP brute-forcing independent of per-code attempt limit
def reset_password():
    payload = request.get_json(silent=True) or {}

    try:
        data = reset_password_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid reset data.", 422, err.messages)

    normalized_phone = _normalize_phone(data["phone_number"])
    user = User.query.filter_by(phone_number=normalized_phone).first()

    generic_error = lambda: error_response(
        "INVALID_OR_EXPIRED_CODE", "The code is invalid or has expired.", 400
    )

    if not user or not user.is_active:
        return generic_error()

    if not verify_otp(user.id, data["otp_code"], purpose="password_reset"):
        return generic_error()

    user.set_password(data["new_password"])
    user.reset_login_attempts()  # clears any lockout too - legitimate owner just proved identity
    db.session.commit()

    return success_response({"message": "Password reset successfully. Please log in."})
END FILE: app/api/v1/auth/routes.py


EDIT: app/services/dashboard_service.py  (REPLACE the whole file with this)
from datetime import datetime, timedelta

from app.models.return_to_work_plan import ReturnToWorkPlan
from app.models.check_in import CheckIn
from app.models.milestone import Milestone


def _time_based_greeting() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    if hour < 17:
        return "Good afternoon"
    return "Good evening"


def build_dashboard(user) -> dict:
    """Pulls together the pieces for the Morning Greeting screen. Read-only -
    doesn't create or modify anything, so this stays safe to call as often
    as the frontend wants (e.g. every time the dashboard tab opens)."""

    greeting = f"{_time_based_greeting()}, {user.full_name.split(' ')[0]}"

    # Quick Check-In status - CheckIn only stores created_at (a timestamp),
    # not a separate date column, so "today" is a range filter on that.
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_end = today_start + timedelta(days=1)
    today_checkin = (
        CheckIn.query.filter(
            CheckIn.user_id == user.id,
            CheckIn.created_at >= today_start,
            CheckIn.created_at < today_end,
        )
        .order_by(CheckIn.created_at.desc())
        .first()
    )

    # Priority Glance - next upcoming milestone
    next_milestone = (
        Milestone.query.filter_by(user_id=user.id, is_completed=False)
        .filter(Milestone.due_date >= datetime.utcnow().date())
        .order_by(Milestone.due_date.asc())
        .first()
    )

    # Active Planner - top 3 incomplete tasks, in the order they were
    # generated/added (position field already carries that intent)
    plan = ReturnToWorkPlan.query.filter_by(user_id=user.id).first()
    top_tasks = []
    weeks_remaining = None
    if plan:
        weeks_remaining = plan.weeks_remaining()
        top_tasks = [
            item.to_dict()
            for item in plan.checklist_items.filter_by(is_completed=False)
            .order_by("position")
            .limit(3)
        ]

    return {
        "greeting": greeting,
        "postpartum_weeks": user.postpartum_weeks(),
        "has_checked_in_today": today_checkin is not None,
        "todays_checkin": today_checkin.to_dict() if today_checkin else None,
        "next_milestone": next_milestone.to_dict() if next_milestone else None,
        "return_to_work": {
            "has_plan": plan is not None,
            "weeks_remaining": weeks_remaining,
            "top_tasks": top_tasks,
        },
    }
END FILE: app/services/dashboard_service.py


AFTER ALL FILES ARE IN PLACE, RUN THIS:

Adds 1 new column to the existing users table, so generate a fresh migration:

flask db migrate -m "Add baby_birth_date to users"
flask db upgrade

flask run


ENDPOINT ADDED

PATCH /api/v1/auth/me

Body (both fields optional, send only what you're updating):
{ "full_name": "New Name", "baby_birth_date": "2026-06-07" }

To clear a previously-set birth date, send: { "baby_birth_date": null }

Requires a valid access token. Returns the updated user profile, now
including "baby_birth_date" and "postpartum_weeks" (both null until set).


WHAT CHANGED IN EXISTING ENDPOINTS

- GET /api/v1/auth/me and the register/login responses now include
  "baby_birth_date" and "postpartum_weeks" in the user object.
- GET /api/v1/dashboard now includes a top-level "postpartum_weeks" field,
  null until the user sets their birth date via PATCH /me.


TEST IT

1. Log in and grab your access_token.

2. Set the birth date:
curl -X PATCH http://127.0.0.1:5000/api/v1/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"baby_birth_date": "2026-06-07"}'

3. Confirm it shows up on the dashboard:
curl http://127.0.0.1:5000/api/v1/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

Look for "postpartum_weeks" near the top of the response.
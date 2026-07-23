from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.extensions import db
from app.models.billing import (
    Subscription,
    EmployerOrganization,
    EmployerEnrollment,
    SubscriptionStatus,
    EnrollmentStatus,
)
from app.models.user import User, UserRole
from app.api.v1.billing.schemas import (
    CreateEmployerOrgSchema,
    JoinEmployerOrgSchema,
    UpgradeSubscriptionSchema,
)
from app.services.billing_service import build_employer_stats, build_employer_roster
from app.security.permissions import role_required
from app.utils.responses import success_response, error_response
from app.models.billing import generate_invite_code

billing_bp = Blueprint("billing", __name__, url_prefix="/api/v1/billing")

create_org_schema = CreateEmployerOrgSchema()
join_org_schema = JoinEmployerOrgSchema()
upgrade_schema = UpgradeSubscriptionSchema()


def _get_or_create_subscription(user_id: str) -> Subscription:
    sub = Subscription.query.filter_by(user_id=user_id).first()
    if not sub:
        sub = Subscription(user_id=user_id)
        db.session.add(sub)
        db.session.commit()
    return sub


# ---------------------------------------------------------------------------
# Subscription (Freemium)
# ---------------------------------------------------------------------------

@billing_bp.route("/subscription", methods=["GET"])
@jwt_required()
def get_subscription():
    user_id = get_jwt_identity()
    sub = _get_or_create_subscription(user_id)
    return success_response(sub.to_dict())


@billing_bp.route("/subscription/upgrade", methods=["POST"])
@jwt_required()
def upgrade_subscription():
    """No real payment gateway is wired up yet (M-Pesa integration is a
    separate, larger task). This marks the request as pending rather than
    pretending a payment happened - the tier only flips to fully ACTIVE
    once that integration exists and confirms payment."""
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    try:
        data = upgrade_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid upgrade request.", 422, err.messages)

    sub = _get_or_create_subscription(user_id)
    sub.tier = data["tier"]
    sub.status = SubscriptionStatus.PENDING_PAYMENT.value
    db.session.commit()

    return success_response(
        {
            "subscription": sub.to_dict(),
            "message": (
                "Upgrade request recorded. Payment processing isn't wired up yet - "
                "this will be confirmed manually until M-Pesa integration is built."
            ),
        }
    )


# ---------------------------------------------------------------------------
# Employer organizations
# ---------------------------------------------------------------------------

@billing_bp.route("/employers", methods=["POST"])
@role_required(UserRole.EMPLOYER.value)
def create_employer_org():
    user_id = get_jwt_identity()

    if EmployerOrganization.query.filter_by(admin_user_id=user_id).first():
        return error_response(
            "ALREADY_EXISTS", "You already have an organization registered.", 409
        )

    payload = request.get_json(silent=True) or {}
    try:
        data = create_org_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid organization data.", 422, err.messages)

    # Extremely unlikely, but guard against a collision anyway rather than
    # trust a random 8-char code is always unique on the first try.
    invite_code = generate_invite_code()
    while EmployerOrganization.query.filter_by(invite_code=invite_code).first():
        invite_code = generate_invite_code()

    org = EmployerOrganization(
        admin_user_id=user_id,
        name=data["name"],
        seat_limit=data["seat_limit"],
        invite_code=invite_code,
    )
    db.session.add(org)
    db.session.commit()

    return success_response(org.to_dict(), 201)


@billing_bp.route("/employers/me", methods=["GET"])
@role_required(UserRole.EMPLOYER.value)
def get_my_employer_org():
    user_id = get_jwt_identity()
    org = EmployerOrganization.query.filter_by(admin_user_id=user_id).first()

    if not org:
        return error_response("NOT_FOUND", "No organization found for this account.", 404)

    return success_response(org.to_dict())


@billing_bp.route("/employers/me/stats", methods=["GET"])
@role_required(UserRole.EMPLOYER.value)
def get_my_employer_stats():
    """AGGREGATE ONLY - no individual mother's identity or wellbeing data
    is ever returned through this endpoint. See billing_service for the
    boundary this enforces."""
    user_id = get_jwt_identity()
    org = EmployerOrganization.query.filter_by(admin_user_id=user_id).first()

    if not org:
        return error_response("NOT_FOUND", "No organization found for this account.", 404)

    return success_response(build_employer_stats(org))


@billing_bp.route("/employers/me/roster", methods=["GET"])
@role_required(UserRole.EMPLOYER.value)
def get_my_employer_roster():
    """Named per-mother view: name + Planner completion percentage only.
    Nothing from Wellbeing (mood, stress, sleep, check-ins) is exposed
    here or anywhere else in this module - see billing_service for the
    hard boundary this enforces."""
    user_id = get_jwt_identity()
    org = EmployerOrganization.query.filter_by(admin_user_id=user_id).first()

    if not org:
        return error_response("NOT_FOUND", "No organization found for this account.", 404)

    return success_response({"roster": build_employer_roster(org)})


@billing_bp.route("/employers/join", methods=["POST"])
@role_required(UserRole.MOTHER.value)
def join_employer_org():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    try:
        data = join_org_schema.load(payload)
    except ValidationError as err:
        return error_response("VALIDATION_ERROR", "Invalid invite code.", 422, err.messages)

    org = EmployerOrganization.query.filter_by(invite_code=data["invite_code"].upper()).first()
    if not org:
        return error_response("INVALID_CODE", "Invite code not recognized.", 404)

    existing = EmployerEnrollment.query.filter_by(
        organization_id=org.id, mother_user_id=user_id
    ).first()
    if existing:
        if existing.status == EnrollmentStatus.ACTIVE.value:
            return error_response("ALREADY_ENROLLED", "You're already enrolled in this organization.", 409)
        existing.status = EnrollmentStatus.ACTIVE.value
        db.session.commit()
        return success_response(existing.to_dict())

    if org.active_seat_count() >= org.seat_limit:
        return error_response("SEAT_LIMIT_REACHED", "This organization has no seats remaining.", 409)

    enrollment = EmployerEnrollment(organization_id=org.id, mother_user_id=user_id)
    db.session.add(enrollment)
    db.session.commit()

    return success_response(enrollment.to_dict(), 201)


@billing_bp.route("/employers/my-enrollment", methods=["GET"])
@role_required(UserRole.MOTHER.value)
def get_my_enrollment():
    """Lets a mother check her own enrollment status - doesn't expose
    anything about other mothers in the same organization."""
    user_id = get_jwt_identity()
    enrollment = (
        EmployerEnrollment.query.filter_by(mother_user_id=user_id, status=EnrollmentStatus.ACTIVE.value)
        .first()
    )

    return success_response({"enrollment": enrollment.to_dict() if enrollment else None})


@billing_bp.route("/employers/leave", methods=["POST"])
@role_required(UserRole.MOTHER.value)
def leave_employer_org():
    user_id = get_jwt_identity()
    enrollment = (
        EmployerEnrollment.query.filter_by(mother_user_id=user_id, status=EnrollmentStatus.ACTIVE.value)
        .first()
    )

    if not enrollment:
        return error_response("NOT_FOUND", "You're not enrolled in any organization.", 404)

    enrollment.status = EnrollmentStatus.REMOVED.value
    db.session.commit()

    return success_response({"message": "You've left the organization."})
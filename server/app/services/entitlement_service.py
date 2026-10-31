from app.models.billing import SubscriptionTier, SubscriptionStatus
from app.models.user import UserRole


# Features available to every mother, regardless of subscription.
MOTHER_FREE_FEATURES = {
    "return_to_work_planning",
    "checklist_management",
    "childcare_planning",
    "wellbeing_checkins",
    "wellbeing_history",
    "wellbeing_summary",
    "milestones",
    "reminders",
    "breathing_exercises",
}

# Additional features available to active Mother Premium subscribers.
MOTHER_PREMIUM_FEATURES = {
    "advanced_wellbeing_insights",
}

# Features available to every employer.
EMPLOYER_FREE_FEATURES = {
    "organization_management",
    "invitations",
    "aggregate_workforce_stats",
    "employee_roster",
}

# Additional features available to active Employer Premium subscribers.
EMPLOYER_PREMIUM_FEATURES = {
    "advanced_workforce_reports",
}


def _has_active_premium(subscription) -> bool:
    """Pending or cancelled subscriptions never grant Premium access."""
    return (
        subscription is not None
        and subscription.tier == SubscriptionTier.PREMIUM.value
        and subscription.status == SubscriptionStatus.ACTIVE.value
    )


def build_entitlements(user, subscription) -> dict:
    """
    Derive feature access from the user's role and active subscription.

    Admin accounts do not inherit Mother or Employer entitlements.
    """

    role = user.role
    is_premium = _has_active_premium(subscription)

    if role == UserRole.MOTHER.value:
        free_features = MOTHER_FREE_FEATURES
        premium_features = MOTHER_PREMIUM_FEATURES

    elif role == UserRole.EMPLOYER.value:
        free_features = EMPLOYER_FREE_FEATURES
        premium_features = EMPLOYER_PREMIUM_FEATURES

    else:
        free_features = set()
        premium_features = set()
        is_premium = False

    available_features = free_features | (
        premium_features if is_premium else set()
    )

    all_features = free_features | premium_features

    return {
        "role": role,
        "tier": subscription.tier if subscription else SubscriptionTier.FREE.value,
        "status": subscription.status if subscription else SubscriptionStatus.ACTIVE.value,
        "is_premium": is_premium,
        "features": {
            feature: feature in available_features
            for feature in sorted(all_features)
        },
    }


def has_feature_access(user, subscription, feature: str) -> bool:
    """Check whether a user can access a specific feature."""
    entitlements = build_entitlements(user, subscription)
    return entitlements["features"].get(feature, False)
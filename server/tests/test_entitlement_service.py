import unittest
from types import SimpleNamespace

from app.models.billing import SubscriptionTier, SubscriptionStatus
from app.models.user import UserRole
from app.services.entitlement_service import (
    build_entitlements,
    has_feature_access,
)


def make_user(role):
    return SimpleNamespace(role=role)


def make_subscription(tier, status):
    return SimpleNamespace(tier=tier, status=status)


class EntitlementServiceTests(unittest.TestCase):

    def test_mother_free_gets_core_features(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.FREE.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertTrue(
            has_feature_access(user, subscription, "wellbeing_checkins")
        )
        self.assertTrue(
            has_feature_access(user, subscription, "return_to_work_planning")
        )
        self.assertFalse(
            has_feature_access(user, subscription, "advanced_wellbeing_insights")
        )

    def test_mother_active_premium_gets_advanced_insights(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertTrue(
            has_feature_access(user, subscription, "advanced_wellbeing_insights")
        )

    def test_pending_payment_does_not_unlock_premium(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.PENDING_PAYMENT.value,
        )

        self.assertFalse(
            has_feature_access(user, subscription, "advanced_wellbeing_insights")
        )

    def test_cancelled_subscription_does_not_unlock_premium(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.CANCELLED.value,
        )

        self.assertFalse(
            has_feature_access(user, subscription, "advanced_wellbeing_insights")
        )

    def test_employer_premium_gets_workforce_reports(self):
        user = make_user(UserRole.EMPLOYER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertTrue(
            has_feature_access(user, subscription, "advanced_workforce_reports")
        )

    def test_employer_does_not_get_mother_premium_features(self):
        user = make_user(UserRole.EMPLOYER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertFalse(
            has_feature_access(user, subscription, "advanced_wellbeing_insights")
        )

    def test_mother_does_not_get_employer_premium_features(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertFalse(
            has_feature_access(user, subscription, "advanced_workforce_reports")
        )

    def test_admin_gets_no_mother_or_employer_features(self):
        user = make_user(UserRole.ADMIN.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        entitlements = build_entitlements(user, subscription)

        self.assertFalse(entitlements["is_premium"])
        self.assertEqual(entitlements["features"], {})

    def test_unknown_feature_is_denied(self):
        user = make_user(UserRole.MOTHER.value)
        subscription = make_subscription(
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        self.assertFalse(
            has_feature_access(user, subscription, "unknown_feature")
        )


if __name__ == "__main__":
    unittest.main()
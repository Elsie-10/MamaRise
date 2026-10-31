import unittest

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.billing import Subscription, SubscriptionTier, SubscriptionStatus
from flask_jwt_extended import create_access_token
from app.security.permissions import feature_required


class EntitlementsApiTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app("testing")
        self.app.config["JWT_SECRET_KEY"] = "test-secret-key-for-mamarise-integration-tests-2026"
        self.client = self.app.test_client()

        protected_view = feature_required(
            "advanced_wellbeing_insights"
        )(lambda: {"access": "granted"})

        self.app.add_url_rule(
            "/test/premium-insights",
            endpoint="test_premium_insights",
            view_func=protected_view,
        )

        with self.app.app_context():
            db.create_all()

            self.mother_id = self.create_user(
                "mother@example.com",
                UserRole.MOTHER.value,
            )
            self.employer_id = self.create_user(
                "employer@example.com",
                UserRole.EMPLOYER.value,
            )
            self.admin_id = self.create_user(
                "admin@example.com",
                UserRole.ADMIN.value,
            )

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def create_user(self, email, role):
        user = User(
            email=email,
            phone_number=f"+2547{len(email)}000000",
            password_hash="test-hash",
            full_name="Test User",
            role=role,
        )
        db.session.add(user)
        db.session.commit()
        return user.id

    def authenticate(self, user_id):
        with self.app.app_context():
            token = create_access_token(identity=user_id)

        return {"Authorization": f"Bearer {token}"}

    def set_subscription(self, user_id, tier, status):
        with self.app.app_context():
            subscription = Subscription(
                user_id=user_id,
                tier=tier,
                status=status,
            )
            db.session.add(subscription)
            db.session.commit()


    def get_entitlements(self, user_id):
        return self.client.get(
            "/api/v1/billing/entitlements",
            headers=self.authenticate(user_id),
        )

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get("/api/v1/billing/entitlements")

        self.assertEqual(response.status_code, 401)

    def test_mother_receives_free_entitlements_by_default(self):
        response = self.get_entitlements(self.mother_id)

        self.assertEqual(response.status_code, 200)

        data = response.get_json()["data"]

        self.assertEqual(data["role"], UserRole.MOTHER.value)
        self.assertEqual(data["tier"], SubscriptionTier.FREE.value)
        self.assertFalse(data["is_premium"])
        self.assertTrue(data["features"]["wellbeing_checkins"])
        self.assertFalse(data["features"]["advanced_wellbeing_insights"])

    def test_employer_receives_employer_features(self):
        response = self.get_entitlements(self.employer_id)

        self.assertEqual(response.status_code, 200)

        data = response.get_json()["data"]

        self.assertEqual(data["role"], UserRole.EMPLOYER.value)
        self.assertTrue(data["features"]["aggregate_workforce_stats"])
        self.assertFalse(data["features"]["advanced_workforce_reports"])
        self.assertNotIn("advanced_wellbeing_insights", data["features"])

    def test_active_mother_premium_receives_advanced_insights(self):
        self.set_subscription(
            self.mother_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        response = self.get_entitlements(self.mother_id)
        data = response.get_json()["data"]

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["is_premium"])
        self.assertTrue(data["features"]["advanced_wellbeing_insights"])

    def test_pending_mother_premium_does_not_unlock_insights(self):
        self.set_subscription(
            self.mother_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.PENDING_PAYMENT.value,
        )

        response = self.get_entitlements(self.mother_id)
        data = response.get_json()["data"]

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["is_premium"])
        self.assertFalse(data["features"]["advanced_wellbeing_insights"])

    def test_active_employer_premium_receives_advanced_reports(self):
        self.set_subscription(
            self.employer_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        response = self.get_entitlements(self.employer_id)
        data = response.get_json()["data"]

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["is_premium"])
        self.assertTrue(data["features"]["advanced_workforce_reports"])

    def test_admin_does_not_receive_premium_features(self):
        self.set_subscription(
            self.admin_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        response = self.get_entitlements(self.admin_id)
        data = response.get_json()["data"]

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["is_premium"])
        self.assertEqual(data["features"], {})

    def test_free_mother_cannot_access_premium_insights(self):
        response = self.client.get(
            "/test/premium-insights",
            headers=self.authenticate(self.mother_id),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json()["error"]["code"],
            "PREMIUM_REQUIRED",
        )

    def test_active_premium_mother_can_access_premium_insights(self):
        self.set_subscription(
            self.mother_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        response = self.client.get(
            "/test/premium-insights",
            headers=self.authenticate(self.mother_id),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"access": "granted"},
        )

    def test_pending_premium_mother_cannot_access_premium_insights(self):
        self.set_subscription(
            self.mother_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.PENDING_PAYMENT.value,
        )

        response = self.client.get(
            "/test/premium-insights",
            headers=self.authenticate(self.mother_id),
        )

        self.assertEqual(response.status_code, 403)

    def test_employer_cannot_access_mother_premium_insights(self):
        self.set_subscription(
            self.employer_id,
            SubscriptionTier.PREMIUM.value,
            SubscriptionStatus.ACTIVE.value,
        )

        response = self.client.get(
            "/test/premium-insights",
            headers=self.authenticate(self.employer_id),
        )

        self.assertEqual(response.status_code, 403)
        
if __name__ == "__main__":
    unittest.main()


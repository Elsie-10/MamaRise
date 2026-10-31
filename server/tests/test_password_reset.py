import re
import unittest
from unittest.mock import patch

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.services.sms_service import sms_service
from app.services.notification_service import notification_service

from datetime import datetime, timedelta, timezone
from app.models.otp import OtpCode
from app.services.otp_service import verify_reset_code

from flask_jwt_extended import create_access_token


class PasswordResetApiTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app("testing")
        self.app.config["JWT_SECRET_KEY"] = (
            "test-secret-key-for-mamarise-password-reset"
        )
        self.app.config["OTP_EXPIRY_MINUTES"] = 10
        self.app.config["RESET_TOKEN_EXPIRY_MINUTES"] = 10

        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            user = User(
                email="mother@example.com",
                phone_number="+254700000001",
                full_name="Test Mother",
                role=UserRole.MOTHER.value,
            )
            user.set_password("OldSecurePass123!")

            db.session.add(user)
            db.session.commit()

            self.user_id = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def request_otp(self):
        messages = []

        with patch.object(
            sms_service,
            "send",
            side_effect=lambda phone, message: (
                messages.append(message) or True
            ),
        ):
            response = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"phone_number": "+254700000001"},
            )

        self.assertEqual(response.status_code, 200)

        match = re.search(
            r"code is (\d{6})",
            messages[0],
        )

        self.assertIsNotNone(match)

        return match.group(1)

    def verify_code(self, code):
        return self.client.post(
            "/api/v1/auth/verify-reset-code",
            json={
                "phone_number": "+254700000001",
                "otp_code": code,
            },
        )

    def test_forgot_password_sends_otp(self):
        with patch.object(
            sms_service,
            "send",
            return_value=True,
        ) as mock_send:

            response = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"phone_number": "+254700000001"},
            )

        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once()

        self.assertIn(
            "verification code has been sent",
            response.get_json()["data"]["message"],
        )

    def test_unknown_phone_receives_generic_response(self):
        with patch.object(
            sms_service,
            "send",
        ) as mock_send:

            response = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"phone_number": "+254700000099"},
            )

        self.assertEqual(response.status_code, 200)
        mock_send.assert_not_called()

        self.assertIn(
            "verification code has been sent",
            response.get_json()["data"]["message"],
        )

    def test_correct_otp_issues_reset_token(self):
        code = self.request_otp()

        response = self.verify_code(code)

        self.assertEqual(response.status_code, 200)

        data = response.get_json()["data"]

        self.assertIn("reset_token", data)
        self.assertGreaterEqual(len(data["reset_token"]), 32)

    def test_wrong_otp_is_rejected(self):
        self.request_otp()

        response = self.verify_code("000000")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"]["code"],
            "INVALID_OR_EXPIRED_CODE",
        )

    def test_password_reset_succeeds(self):
        code = self.request_otp()

        verification = self.verify_code(code)
        reset_token = verification.get_json()["data"]["reset_token"]

        response = self.client.post(
            "/api/v1/auth/reset-password",
            json={
                "reset_token": reset_token,
                "new_password": "NewSecurePass456!",
            },
        )

        self.assertEqual(response.status_code, 200)

        with self.app.app_context():
            user = db.session.get(User, self.user_id)

            self.assertTrue(
                user.verify_password("NewSecurePass456!")
            )
            self.assertFalse(
                user.verify_password("OldSecurePass123!")
            )
            self.assertEqual(user.token_version, 1)

    def test_reset_token_cannot_be_reused(self):
        code = self.request_otp()

        verification = self.verify_code(code)
        reset_token = verification.get_json()["data"]["reset_token"]

        payload = {
            "reset_token": reset_token,
            "new_password": "NewSecurePass456!",
        }

        first_response = self.client.post(
            "/api/v1/auth/reset-password",
            json=payload,
        )

        second_response = self.client.post(
            "/api/v1/auth/reset-password",
            json=payload,
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 400)

    def test_otp_cannot_be_verified_twice(self):
        code = self.request_otp()

        first_response = self.verify_code(code)
        second_response = self.verify_code(code)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 400)

    def test_email_recovery_sends_otp(self):
        with patch.object(
            notification_service,
            "send_password_reset_email",
            return_value=True,
        ) as mock_email:

            response = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "mother@example.com"},
            )

        self.assertEqual(response.status_code, 200)
        mock_email.assert_called_once()

        recipient, otp_code = mock_email.call_args.args

        self.assertEqual(recipient, "mother@example.com")
        self.assertRegex(otp_code, r"^\d{6}$")


    def test_failed_sms_delivery_invalidates_otp(self):
        messages = []

        with patch.object(
            sms_service,
            "send",
            side_effect=lambda phone, message: (
                messages.append(message) or False
            ),
        ):
            response = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"phone_number": "+254700000001"},
            )

        self.assertEqual(response.status_code, 200)

        match = re.search(r"code is (\d{6})", messages[0])
        self.assertIsNotNone(match)

        verification = self.verify_code(match.group(1))

        self.assertEqual(verification.status_code, 400)

    def test_expired_otp_is_rejected(self):
        code = self.request_otp()

        with self.app.app_context():
            otp = OtpCode.query.filter_by(
                user_id=self.user_id,
                purpose="password_reset",
            ).first()

            otp.expires_at = (
                datetime.now(timezone.utc).replace(tzinfo=None)
                - timedelta(minutes=1)
            )
            db.session.commit()

        response = self.verify_code(code)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"]["code"],
            "INVALID_OR_EXPIRED_CODE",
        )


    def test_otp_is_rejected_after_maximum_failed_attempts(self):
        code = self.request_otp()

        wrong_code = f"{(int(code) + 1) % 1000000:06d}"

        with self.app.app_context():
            for _ in range(5):
                result = verify_reset_code(
                    self.user_id,
                    wrong_code,
                    purpose="password_reset",
                )
                self.assertIsNone(result)

            result = verify_reset_code(
                self.user_id,
                code,
                purpose="password_reset",
            )

            self.assertIsNone(result)

    def test_password_reset_invalidates_existing_access_token(self):
        with self.app.app_context():
            old_access_token = create_access_token(
                identity=self.user_id,
                additional_claims={"token_version": 0},
            )

        code = self.request_otp()
        verification = self.verify_code(code)

        self.assertEqual(verification.status_code, 200)

        reset_token = verification.get_json()["data"]["reset_token"]

        reset_response = self.client.post(
            "/api/v1/auth/reset-password",
            json={
                "reset_token": reset_token,
                "new_password": "NewSecurePass456!",
            },
        )

        self.assertEqual(reset_response.status_code, 200)

        response = self.client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {old_access_token}",
            },
        )

        self.assertEqual(response.status_code, 401)

    def test_expired_reset_token_is_rejected(self):
        code = self.request_otp()
        verification = self.verify_code(code)

        self.assertEqual(verification.status_code, 200)

        reset_token = verification.get_json()["data"]["reset_token"]

        with self.app.app_context():
            otp = OtpCode.query.filter_by(
                user_id=self.user_id,
                purpose="password_reset",
            ).first()

            otp.reset_token_expires_at = (
                datetime.now(timezone.utc).replace(tzinfo=None)
                - timedelta(minutes=1)
            )
            db.session.commit()

        response = self.client.post(
            "/api/v1/auth/reset-password",
            json={
                "reset_token": reset_token,
                "new_password": "NewSecurePass456!",
            },
        )

        self.assertEqual(response.status_code, 400)

        with self.app.app_context():
            user = db.session.get(User, self.user_id)
            self.assertTrue(user.verify_password("OldSecurePass123!"))
if __name__ == "__main__":
    unittest.main()

import logging
import smtplib
from email.message import EmailMessage

from flask import current_app

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def send_password_reset_email(recipient: str, otp_code: str) -> bool:
        config = current_app.config

        mail_server = config.get("MAIL_SERVER")
        mail_port = config.get("MAIL_PORT", 587)
        username = config.get("MAIL_USERNAME")
        password = config.get("MAIL_PASSWORD")
        sender = config.get("MAIL_DEFAULT_SENDER")
        use_tls = config.get("MAIL_USE_TLS", True)

        if not all([mail_server, username, password, sender]):
            logger.error("Email service is not properly configured.")
            return False

        message = EmailMessage()
        message["Subject"] = "MamaRise Password Reset"
        message["From"] = sender
        message["To"] = recipient

        message.set_content(
            f"""
Hello,

We received a request to reset your MamaRise password.

Your verification code is: {otp_code}

This code expires in {config.get("OTP_EXPIRY_MINUTES", 10)} minutes.

If you did not request this, you can safely ignore this email.

MamaRise Team
            """.strip()
        )

        try:
            with smtplib.SMTP(mail_server, mail_port, timeout=15) as server:
                server.ehlo()

                if use_tls:
                    server.starttls()
                    server.ehlo()

                server.login(username, password)
                server.send_message(message)

            return True

        except (smtplib.SMTPException, OSError):
            logger.exception("Failed to send password reset email.")
            return False


notification_service = NotificationService()

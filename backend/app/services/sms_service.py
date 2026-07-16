import os
import logging

logger = logging.getLogger("mamarise.sms")


class SmsService:
    """Thin wrapper so the rest of the app never talks to a specific SMS
    provider directly - swap providers here without touching routes/services.

    In local dev (no AT_API_KEY set), messages are logged instead of sent,
    so you can test the OTP flow without spending SMS credit or needing
    real Africa's Talking credentials yet.
    """

    def __init__(self):
        self.username = os.environ.get("AT_USERNAME")
        self.api_key = os.environ.get("AT_API_KEY")
        self.sender_id = os.environ.get("AT_SENDER_ID", "MamaRise")
        self._client = None

        if self.username and self.api_key:
            import africastalking

            africastalking.initialize(self.username, self.api_key)
            self._client = africastalking.SMS

    def send(self, phone_number: str, message: str) -> bool:
        if not self._client:
            # DEV MODE: no real credentials configured yet.
            logger.warning(
                "[DEV MODE - NO SMS SENT] Would send to %s: %s", phone_number, message
            )
            print(f"\n[DEV SMS] To: {phone_number} | Message: {message}\n")
            return True

        try:
            response = self._client.send(message, [phone_number], self.sender_id)
            logger.info("SMS sent to %s: %s", phone_number, response)
            return True
        except Exception as exc:
            logger.error("Failed to send SMS to %s: %s", phone_number, exc)
            return False


sms_service = SmsService()
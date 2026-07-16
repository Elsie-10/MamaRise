import re

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
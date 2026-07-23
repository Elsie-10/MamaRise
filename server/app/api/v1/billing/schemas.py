from marshmallow import Schema, fields, validate

from app.models.billing import SubscriptionTier

VALID_TIERS = [t.value for t in SubscriptionTier]


class CreateEmployerOrgSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    seat_limit = fields.Int(required=False, load_default=25, validate=validate.Range(min=1, max=1000))


class JoinEmployerOrgSchema(Schema):
    invite_code = fields.Str(required=True, validate=validate.Length(min=4, max=20))


class UpgradeSubscriptionSchema(Schema):
    tier = fields.Str(required=True, validate=validate.OneOf(VALID_TIERS))
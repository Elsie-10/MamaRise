from marshmallow import Schema, fields, validate

from app.models.milestone import MilestoneType

VALID_MILESTONE_TYPES = [t.value for t in MilestoneType]


class CreateMilestoneSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    type = fields.Str(required=True, validate=validate.OneOf(VALID_MILESTONE_TYPES))
    due_date = fields.Date(required=True)
    notes = fields.Str(required=False, allow_none=True)


class UpdateMilestoneSchema(Schema):
    title = fields.Str(required=False, validate=validate.Length(min=2, max=255))
    type = fields.Str(required=False, validate=validate.OneOf(VALID_MILESTONE_TYPES))
    due_date = fields.Date(required=False)
    notes = fields.Str(required=False, allow_none=True)
    is_completed = fields.Bool(required=False)


class NotificationPreferenceSchema(Schema):
    daily_wellbeing_nudges = fields.Bool(required=False)
    vitamin_reminders = fields.Bool(required=False)
    milestone_reminders = fields.Bool(required=False)
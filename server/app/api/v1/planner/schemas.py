from datetime import date

from marshmallow import Schema, fields, validate, validates, ValidationError

from app.models.return_to_work_plan import WorkType, TaskCategory

VALID_WORK_TYPES = [w.value for w in WorkType]
VALID_CATEGORIES = [c.value for c in TaskCategory]


class CreatePlanSchema(Schema):
    work_type = fields.Str(required=True, validate=validate.OneOf(VALID_WORK_TYPES))
    return_date = fields.Date(required=True)

    @validates("return_date")
    def check_future_date(self, value, **kwargs):
        if value <= date.today():
            raise ValidationError("Return date must be in the future.")


class UpdatePlanSchema(Schema):
    work_type = fields.Str(required=False, validate=validate.OneOf(VALID_WORK_TYPES))
    return_date = fields.Date(required=False)

    @validates("return_date")
    def check_future_date(self, value, **kwargs):
        if value <= date.today():
            raise ValidationError("Return date must be in the future.")


class CreateChecklistItemSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    category = fields.Str(required=True, validate=validate.OneOf(VALID_CATEGORIES))


class UpdateChecklistItemSchema(Schema):
    title = fields.Str(required=False, validate=validate.Length(min=2, max=255))
    category = fields.Str(required=False, validate=validate.OneOf(VALID_CATEGORIES))
    is_completed = fields.Bool(required=False)


class ChildcareArrangementSchema(Schema):
    primary_caregiver = fields.Str(required=False, allow_none=True, validate=validate.Length(max=255))
    backup_plan = fields.Str(required=False, allow_none=True)
    commute_notes = fields.Str(required=False, allow_none=True)
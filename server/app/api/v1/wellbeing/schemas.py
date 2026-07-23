from marshmallow import Schema, fields, validate


class CreateCheckInSchema(Schema):
    mood_score = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    stress_score = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    sleep_hours = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0, max=24))
    note = fields.Str(required=False, allow_none=True, validate=validate.Length(max=1000))


class ListCheckInsQuerySchema(Schema):
    page = fields.Int(required=False, load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(required=False, load_default=20, validate=validate.Range(min=1, max=100))
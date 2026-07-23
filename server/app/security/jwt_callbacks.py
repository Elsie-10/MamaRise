from datetime import datetime

from flask_jwt_extended import JWTManager

from app.extensions import db
from app.models.user import TokenBlocklist
from app.utils.responses import error_response


def register_jwt_callbacks(jwt: JWTManager):

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = db.session.query(TokenBlocklist).filter_by(jti=jti).first()
        return token is not None

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response("TOKEN_REVOKED", "This token has been revoked. Please log in again.", 401)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("TOKEN_EXPIRED", "Your session has expired. Please log in again.", 401)

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return error_response("INVALID_TOKEN", "Token is invalid.", 401)

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return error_response("UNAUTHORIZED", "Authentication token is required.", 401)

    @jwt.additional_claims_loader
    def add_claims(identity):
        # identity here is the user_id string; role gets attached explicitly
        # at token-creation time in routes.py instead, this hook stays available
        # for anything global you want stamped on every token later.
        return {}
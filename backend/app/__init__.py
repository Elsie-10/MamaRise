import os

from flask import Flask

from app.config import config_by_name
from app.extensions import db, migrate, jwt, cors, limiter
from app.security.jwt_callbacks import register_jwt_callbacks
from app.utils.responses import error_response


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[env])

    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _apply_security_headers(app)

    return app


def _init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Explicit origin whitelist only - never "*" once auth/cookies are involved
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    register_jwt_callbacks(jwt)


def _register_blueprints(app):
    from app.api.v1.auth.routes import auth_bp
    from app.api.v1.planner.routes import planner_bp
    from app.api.v1.wellbeing.routes import wellbeing_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(planner_bp)
    app.register_blueprint(wellbeing_bp)
    # Future blueprints (appointments_bp, billing_bp) register here the
    # same way once each module is built.


def _register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return error_response("NOT_FOUND", "The requested resource was not found.", 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("METHOD_NOT_ALLOWED", "This method is not allowed on this endpoint.", 405)

    @app.errorhandler(429)
    def ratelimited(e):
        return error_response("RATE_LIMITED", "Too many requests. Please slow down.", 429)

    @app.errorhandler(500)
    def server_error(e):
        # Never leak stack traces or internals to the client
        return error_response("SERVER_ERROR", "An unexpected error occurred.", 500)


def _apply_security_headers(app):
    @app.after_request
    def set_secure_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not app.debug:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response
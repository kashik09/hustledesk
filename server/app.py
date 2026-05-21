import os
from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)

    # Load config
    from server.config import config_by_name
    config_class = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_class())

    # Initialize extensions
    from server.extensions import db, migrate, jwt, cors, bcrypt, limiter

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Import models so Alembic can detect them
    from server import models  # noqa: F401
    cors.init_app(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]))
    bcrypt.init_app(app)

    # Security headers
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Health check routes
    @app.route("/")
    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "hustledesk-api"})

    # Register blueprints
    from server.routes.auth import auth_bp
    from server.routes.subscriptions import subscriptions_bp
    from server.routes.notifications import notifications_bp
    from server.routes.cron import cron_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(subscriptions_bp, url_prefix="/api/subscriptions")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(cron_bp, url_prefix="/api/cron")

    return app

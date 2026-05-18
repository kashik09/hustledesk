import os

from flask import Flask, jsonify

from dotenv import load_dotenv

from extensions import (
    db,
    migrate,
    jwt,
    cors,
    bcrypt
)

from routes.auth import auth_bp

from routes.subscription import subscriptions_bp

from routes.admin import admin_bp


load_dotenv()


def create_app(config_name=None):
    """Application factory."""

    if config_name is None:

        config_name = os.environ.get(
            "FLASK_ENV",
            "development"
        )

    app = Flask(__name__)

    # =========================
    # LOAD CONFIG
    # =========================
    from config import config_by_name

    config_class = config_by_name.get(
        config_name,
        config_by_name["development"]
    )

    app.config.from_object(
        config_class()
    )

    # =========================
    # INITIALIZE EXTENSIONS
    # =========================
    db.init_app(app)

    migrate.init_app(app, db)

    jwt.init_app(app)

    cors.init_app(
        app,
        origins=app.config.get(
            "CORS_ORIGINS",
            ["http://localhost:5173"]
        )
    )

    bcrypt.init_app(app)

    # =========================
    # IMPORT MODELS
    # =========================
    import models  # noqa: F401

    # =========================
    # ROOT ROUTE
    # =========================
    @app.route("/")
    def home():

        return jsonify({
            "message": "HustleDesk API running"
        })

    # =========================
    # HEALTH CHECK
    # =========================
    @app.route("/api/health")
    def health_check():

        return jsonify({
            "status": "ok",
            "service": "hustledesk-api"
        })

    # =========================
    # REGISTER BLUEPRINTS
    # =========================
    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        subscriptions_bp,
        url_prefix="/api/subscriptions"
    )

    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )

    return app


app = create_app()


if __name__ == "__main__":

    app.run(
        debug=True
    )
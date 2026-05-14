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

    config_class = config_by_name.get(
        config_name,
        config_by_name["development"]
    )

    app.config.from_object(config_class())

    # Initialize extensions
    from server.extensions import (
        db,
        migrate,
        jwt,
        cors,
        bcrypt
    )

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

    # Health check route
    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "ok",
            "service": "hustledesk-api"
        })

    # Register blueprints
    from server.routes.auth import auth_bp

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
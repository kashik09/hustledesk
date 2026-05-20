import os
from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)

    from server.config import config_by_name
    config_class = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_class())

    from server.extensions import db, migrate, jwt, cors, bcrypt, limiter

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]))
    bcrypt.init_app(app)
    limiter.init_app(app)

    from server import models

    @app.after_request
    def headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    from server.routes.auth import auth_bp
    from server.routes.subscriptions import subscriptions_bp
    from server.routes.notifications import notifications_bp
    from server.routes.cron import cron_bp
    from server.routes.admin import admin_bp
    from server.routes.admin_templates import admin_templates_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(subscriptions_bp, url_prefix="/api/subscriptions")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(cron_bp, url_prefix="/api/cron")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_templates_bp, url_prefix="/api/admin")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
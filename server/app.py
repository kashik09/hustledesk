from flask import Flask
from server.config import Config
from server.extensions import db, migrate, jwt, bcrypt, cors
from server.routes.templates import templates_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # initialize extensions (GLOBAL ONES from extensions.py)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)

    # register blueprints
    app.register_blueprint(templates_bp)

    @app.route("/")
    def home():
        return {"message": "HustleDesk API is running"}

    return app


# Flask CLI entry point support
app = create_app()
"""WSGI entry point for Render deployment."""

from app import create_app

from extensions import db


app = create_app()


# Auto-create tables on startup
with app.app_context():

    db.create_all()
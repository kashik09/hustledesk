"""WSGI entry point for Render deployment."""
from server.app import create_app
from server.extensions import db

app = create_app()

# Auto-create tables on startup (for free tier without shell access)
with app.app_context():
    db.create_all()

"""WSGI entry point for Render deployment."""
from server.app import create_app

app = create_app()

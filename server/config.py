import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return os.environ.get("DATABASE_URL", "sqlite:///hustledesk.db")

    @property
    def CORS_ORIGINS(self):
        origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
        return [o.strip() for o in origins.split(",")]


class DevConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProdConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_ECHO = False

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        uri = os.environ.get("DATABASE_URL")
        if uri and uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        return uri


class TestConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_by_name = {
    "development": DevConfig,
    "production": ProdConfig,
    "testing": TestConfig,
}

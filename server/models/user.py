from datetime import datetime

from server.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    home_currency = db.Column(
        db.String(10),
        default="KES"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "home_currency": self.home_currency,
            "created_at": self.created_at.isoformat(),
        }
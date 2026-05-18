from datetime import datetime

from extensions import db, bcrypt


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

    is_admin = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # =========================
    # PASSWORD METHODS
    # =========================
    def set_password(self, password):

        self.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    def check_password(self, password):

        return bcrypt.check_password_hash(
            self.password_hash,
            password
        )

    # =========================
    # SERIALIZER
    # =========================
    def to_dict(self):

        return {
            "id": self.id,
            "email": self.email,
            "home_currency": self.home_currency,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None
        }
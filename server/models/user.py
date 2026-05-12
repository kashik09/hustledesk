"""
User model — auth + home_currency preference.

home_currency (defaults to 'KES') is the display currency for all
dashboard totals. Subscription.currency stores the original billing
currency separately. Conversion happens at read time.

password_hash is stored via flask_bcrypt; never exposed in to_dict.
"""
from datetime import datetime
from server.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    home_currency = db.Column(db.String(3), nullable=False, default="KES")
    budget_kes = db.Column(db.Numeric(12, 2), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    subscriptions = db.relationship(
        "Subscription", backref="user", cascade="all, delete-orphan"
    )

    def set_password(self, plain_text):
        self.password_hash = bcrypt.generate_password_hash(plain_text).decode("utf-8")

    def check_password(self, plain_text):
        return bcrypt.check_password_hash(self.password_hash, plain_text)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "home_currency": self.home_currency,
            "budget_kes": float(self.budget_kes) if self.budget_kes else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.email}>"

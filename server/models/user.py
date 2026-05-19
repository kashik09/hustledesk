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

    # Profile fields
    name = db.Column(db.String(100), nullable=True)
    username = db.Column(db.String(50), unique=True, nullable=True, index=True)
    is_admin = db.Column(db.Boolean, default=False)

    # Account lockout fields
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

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
            "name": self.name,
            "username": self.username,
            "home_currency": self.home_currency,
            "budget_kes": float(self.budget_kes) if self.budget_kes else None,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_locked(self):
        """Check if account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until

    def increment_failed_login(self):
        """Increment failed login attempts, lock if >= 5."""
        from datetime import timedelta
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)

    def reset_failed_login(self):
        """Reset failed login attempts on successful login."""
        self.failed_login_attempts = 0
        self.locked_until = None

    def __repr__(self):
        return f"<User {self.email}>"

"""
Subscription model — user-owned, multi-currency.

Each subscription stores its original billing currency (ISO 4217) so we
never lose the source-of-truth amount. Display conversion to the user's
home_currency happens at read time, not at write time.

Answers teacher Q1 ('What if sub is in KSH?'). See docs/RATE_METHODOLOGY.md.
"""
from datetime import datetime
from server.extensions import db


class Subscription(db.Model):
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    billing_cycle = db.Column(db.String(20), nullable=False, default="monthly")
    category = db.Column(db.String(40), nullable=False, default="other")
    seats = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "amount": float(self.amount),
            "currency": self.currency,
            "billing_cycle": self.billing_cycle,
            "category": self.category,
            "seats": self.seats or 1,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Subscription {self.name} ({self.currency} {self.amount})>"

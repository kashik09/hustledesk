"""
Subscription model — user-owned, multi-currency.

Each subscription stores its original billing currency (ISO 4217) so we
never lose the source-of-truth amount. Display conversion to the user's
home_currency happens at read time, not at write time.

Answers teacher Q1 ('What if sub is in KSH?'). See docs/RATE_METHODOLOGY.md.
"""
from datetime import datetime
from server.extensions import db

# Multipliers to normalise any billing cycle to a monthly equivalent
# yearly  → divide by 12
# weekly  → multiply by 4.345 (avg weeks per month = 365/12/7)
# daily   → multiply by 30.44 (avg days per month = 365/12)
# monthly → no change
CYCLE_TO_MONTHLY = {
    "monthly": 1.0,
    "annual":  1 / 12,
    "weekly":  4.345,
    "daily":   30.44,
}


class Subscription(db.Model):
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    name     = db.Column(db.String(100), nullable=False)
    amount   = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    billing_cycle = db.Column(db.String(20), nullable=False, default="monthly")
    category      = db.Column(db.String(40), nullable=False, default="other")
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def monthly_kes_amount(self, rate_kes: float) -> float:
        """
        Return the monthly KES cost of this subscription.

        Args:
            rate_kes: today's exchange rate — 1 unit of self.currency = rate_kes KES.
                      Pass 1.0 if currency is already KES.

        Examples:
            # Netflix $15.99/month, rate = 132.0
            sub.monthly_kes_amount(132.0) → 2110.68

            # Spotify $99/year, rate = 132.0
            sub.monthly_kes_amount(132.0) → 99 * 132.0 / 12 = 1089.0

            # Daily plan KES 50/day (rate = 1.0)
            sub.monthly_kes_amount(1.0) → 50 * 30.44 = 1522.0
        """
        multiplier = CYCLE_TO_MONTHLY.get(self.billing_cycle, 1.0)
        return float(self.amount) * rate_kes * multiplier

    def to_dict(self):
        return {
            "id":           self.id,
            "user_id":      self.user_id,
            "name":         self.name,
            "amount":       float(self.amount),
            "currency":     self.currency,
            "billing_cycle": self.billing_cycle,
            "category":     self.category,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Subscription {self.name} ({self.currency} {self.amount})>"

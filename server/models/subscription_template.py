from datetime import datetime
from server.extensions import db


class SubscriptionTemplate(db.Model):
    __tablename__ = "subscription_templates"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(40), nullable=False, index=True)
    service_name = db.Column(db.String(80), nullable=False, index=True)
    country_code = db.Column(db.String(2), nullable=False, index=True)
    plan_name = db.Column(db.String(80), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    billing_cycle = db.Column(db.String(20), nullable=False, default="monthly")
    source_url = db.Column(db.String(255), nullable=True)
    last_verified_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            "service_name", "country_code", "plan_name",
            name="uq_template_service_country_plan"
        ),
        db.Index(
            "ix_template_service_country",
            "service_name", "country_code"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "service_name": self.service_name,
            "country_code": self.country_code,
            "plan_name": self.plan_name,
            "amount": float(self.amount),
            "currency": self.currency,
            "billing_cycle": self.billing_cycle,
            "source_url": self.source_url,
            "last_verified_at": (
                self.last_verified_at.isoformat() if self.last_verified_at else None
            ),
        }

    def __repr__(self):
        return f"<SubscriptionTemplate {self.service_name} ({self.country_code})>"

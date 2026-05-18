from extensions import db


class SubscriptionTemplate(db.Model):

    __tablename__ = "subscription_templates"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(120),
        nullable=False
    )

    category = db.Column(
        db.String(100)
    )

    pricing_tiers = db.Column(
        db.JSON,
        nullable=True
    )

    per_seat = db.Column(
        db.Boolean,
        default=False
    )

    def to_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "pricing_tiers": self.pricing_tiers,
            "per_seat": self.per_seat
        }
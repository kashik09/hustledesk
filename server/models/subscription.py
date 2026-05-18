from extensions import db


class Subscription(db.Model):

    __tablename__ = "subscriptions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(120),
        nullable=False
    )

    category = db.Column(
        db.String(80),
        nullable=False
    )

    amount = db.Column(
        db.Float,
        nullable=False
    )

    currency = db.Column(
        db.String(10),
        nullable=False,
        default="KES"
    )

    billing_cycle = db.Column(
        db.String(20),
        nullable=False
    )

    next_payment_date = db.Column(
        db.String(50),
        nullable=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    def to_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "amount": self.amount,
            "currency": self.currency,
            "billing_cycle": self.billing_cycle,
            "next_payment_date": self.next_payment_date,
            "user_id": self.user_id,
        }
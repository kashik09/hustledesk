from server.extensions import db

class SubscriptionTemplate(db.Model):
    __tablename__ = "subscription_templates"

    id = db.Column(db.Integer, primary_key=True)

    service_name = db.Column(db.String(100), nullable=False)
    plan_name = db.Column(db.String(100))
    country = db.Column(db.String(10))
    currency = db.Column(db.String(10))
    amount = db.Column(db.Float)
    category = db.Column(db.String(50))
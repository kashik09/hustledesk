import json
import os

from server.app import create_app
from server.extensions import db
from server.models.subscription_template import SubscriptionTemplate

def run_seed():
    app = create_app()

    with app.app_context():

        # safer path handling (prevents file not found errors)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, "templates.json")

        with open(file_path, "r") as f:
            templates = json.load(f)

        for item in templates:

            exists = SubscriptionTemplate.query.filter_by(
                service_name=item["service_name"],
                plan_name=item["plan_name"],
                country=item["country"]
            ).first()

            if exists:
                continue

            template = SubscriptionTemplate(
                service_name=item["service_name"],
                plan_name=item.get("plan_name"),
                country=item.get("country"),
                currency=item.get("currency"),
                amount=item.get("amount"),
                category=item.get("category")
            )

            db.session.add(template)

        db.session.commit()
        print("Templates seeded successfully 🚀")


if __name__ == "__main__":
    run_seed()
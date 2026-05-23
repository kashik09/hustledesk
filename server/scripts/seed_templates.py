"""
Seed subscription templates from templates.json.

Usage:
    cd server
    python -m scripts.seed_templates

This script uses an upsert pattern to avoid duplicates.
"""
import json
import os
import sys

# Add server directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.app import create_app
from server.extensions import db
from server.models import SubscriptionTemplate


def load_templates():
    """Load templates from JSON file."""
    json_path = os.path.join(os.path.dirname(__file__), "templates.json")
    with open(json_path, "r") as f:
        return json.load(f)


def seed_templates():
    """Seed templates using upsert pattern."""
    app = create_app()

    with app.app_context():
        templates_data = load_templates()
        created = 0
        updated = 0

        for data in templates_data:
            # Check if template exists (by unique constraint)
            existing = SubscriptionTemplate.query.filter_by(
                service_name=data["service_name"],
                country_code=data["country_code"],
                plan_name=data["plan_name"]
            ).first()

            if existing:
                # Update existing template
                existing.category = data["category"]
                existing.amount = data["amount"]
                existing.currency = data["currency"]
                existing.billing_cycle = data.get("billing_cycle", "monthly")
                existing.pricing_tiers = data.get("pricing_tiers")
                existing.per_seat_pricing = data.get("per_seat_pricing", False)
                updated += 1
            else:
                # Create new template
                template = SubscriptionTemplate(
                    service_name=data["service_name"],
                    country_code=data["country_code"],
                    plan_name=data["plan_name"],
                    category=data["category"],
                    amount=data["amount"],
                    currency=data["currency"],
                    billing_cycle=data.get("billing_cycle", "monthly"),
                    pricing_tiers=data.get("pricing_tiers"),
                    per_seat_pricing=data.get("per_seat_pricing", False),
                )
                db.session.add(template)
                created += 1

        db.session.commit()
        print(f"Seed complete: {created} created, {updated} updated")


if __name__ == "__main__":
    seed_templates()

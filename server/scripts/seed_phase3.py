import random
from datetime import datetime, timedelta

from faker import Faker

from server.app import create_app
from server.extensions import db

from server.models.user import User
from server.models.subscription import Subscription
from server.models.subscription_template import SubscriptionTemplate
from server.models.rate_snapshot import RateSnapshot


fake = Faker()

app = create_app()


with app.app_context():

    db.drop_all()
    db.create_all()

    admin = User(
        email="admin@hustledesk.com",
        home_currency="KES",
        is_admin=True
    )

    admin.set_password("Admin123")

    db.session.add(admin)

    users = []

    for _ in range(15):

        user = User(
            email=fake.unique.email(),
            home_currency=random.choice([
                "KES",
                "USD",
                "EUR",
                "GBP"
            ]),
            is_admin=False,
            created_at=datetime.utcnow() - timedelta(
                days=random.randint(1, 30)
            )
        )

        user.set_password("Password123")

        users.append(user)

    db.session.add_all(users)
    db.session.commit()

    categories = [
        "Entertainment",
        "Music",
        "Productivity",
        "Cloud",
        "AI"
    ]

    billing_cycles = [
        "monthly",
        "yearly"
    ]

    currencies = [
        "KES",
        "USD",
        "EUR"
    ]

    subscriptions = []

    for _ in range(100):

        subscription = Subscription(
            user_id=random.choice(users).id,
            name=random.choice([
                "Netflix",
                "Spotify",
                "Canva",
                "AWS",
                "ChatGPT"
            ]),
            amount=random.randint(500, 10000),
            currency=random.choice(currencies),
            billing_cycle=random.choice(billing_cycles),
            category=random.choice(categories)
        )

        subscriptions.append(subscription)

    db.session.add_all(subscriptions)

    templates = []

    for i in range(20):

        template = SubscriptionTemplate(
            category=random.choice(categories),
            service_name=f"Service {i + 1}",
            country_code="KE",
            plan_name=random.choice([
                "Basic",
                "Pro",
                "Enterprise"
            ]),
            amount=random.randint(500, 15000),
            currency="KES",
            billing_cycle="monthly",
            pricing_tiers=[
                {
                    "name": "Basic",
                    "price": 500
                },
                {
                    "name": "Pro",
                    "price": 1500
                },
                {
                    "name": "Enterprise",
                    "price": 5000
                }
            ],
            per_seat_pricing=random.choice([
                True,
                False
            ]),
            source_url="https://example.com"
        )

        templates.append(template)

    db.session.add_all(templates)

    snapshots = []

    for day in range(30):

        snapshot = RateSnapshot(
            from_currency="USD",
            to_currency="KES",
            rate=random.uniform(120, 150),
            source="ExchangeRateAPI",
            captured_at=datetime.utcnow() - timedelta(days=day)
        )

        snapshots.append(snapshot)

    db.session.add_all(snapshots)

    db.session.commit()

    print("Phase 3 seed completed successfully")
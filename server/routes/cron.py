"""
Cron routes — protected endpoints for scheduled tasks.

These endpoints are called by external cron services (GitHub Actions, cron-job.org).
Protected by CRON_SECRET header to prevent unauthorized access.
"""
import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from server.extensions import db
from server.models import User, Subscription, Notification
#from server.utils.email import send_renewal_reminder, send_weekly_summary

cron_bp = Blueprint("cron", __name__)

CRON_SECRET = os.environ.get("CRON_SECRET", "dev-cron-secret")


def verify_cron_secret():
    """Verify the request has valid CRON_SECRET header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header != f"Bearer {CRON_SECRET}":
        return False
    return True


@cron_bp.route("/renewal-reminders", methods=["POST"])
def send_renewal_reminders():
    """
    POST /api/cron/renewal-reminders
    Send renewal reminder emails for subscriptions renewing in 3 days.
    Called daily by cron job.
    """
    if not verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 401

    # Find subscriptions renewing in 3 days
    target_date = datetime.utcnow().date() + timedelta(days=3)

    subscriptions = Subscription.query.filter(
        func.date(Subscription.next_renewal) == target_date
    ).all()

    sent_count = 0
    notification_count = 0

    for sub in subscriptions:
        user = User.query.get(sub.user_id)
        if not user:
            continue

        # Send email
        #send_renewal_reminder(
            to_email=user.email,
            name=user.name,
            subscription_name=sub.name,
            renewal_date=target_date.strftime("%B %d, %Y"),
            amount=float(sub.amount),
            currency=sub.currency
       # )
        sent_count += 1

        # Create in-app notification
        notification = Notification(
            user_id=user.id,
            type="renewal_reminder",
            title=f"{sub.name} renews in 3 days",
            message=f"Your {sub.name} subscription ({sub.currency} {sub.amount}) will renew on {target_date.strftime('%B %d')}."
        )
        db.session.add(notification)
        notification_count += 1

    db.session.commit()

    return jsonify({
        "message": f"Sent {sent_count} renewal reminders",
        "emails_sent": sent_count,
        "notifications_created": notification_count
    }), 200


@cron_bp.route("/weekly-summary", methods=["POST"])
def send_weekly_summaries():
    """
    POST /api/cron/weekly-summary
    Send weekly spending summary emails to all users.
    Called weekly (Sunday 8am) by cron job.
    """
    if not verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 401

    users = User.query.all()
    sent_count = 0

    for user in users:
        # Get user's subscriptions
        subscriptions = Subscription.query.filter_by(user_id=user.id).all()

        if not subscriptions:
            continue

        # Calculate total monthly KES (simplified - assumes monthly cycle)
        # TODO: Proper cycle conversion
        total_kes = sum(float(s.amount) * 129 for s in subscriptions if s.currency == "USD")
        total_kes += sum(float(s.amount) for s in subscriptions if s.currency == "KES")

        # Get top categories
        category_totals = {}
        for sub in subscriptions:
            cat = sub.category or "other"
            amount = float(sub.amount) * (129 if sub.currency == "USD" else 1)
            category_totals[cat] = category_totals.get(cat, 0) + amount

        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)

        # Send email
        # send_weekly_summary(
        to_email=user.email,
           #name=user.name,
           ## total_kes=total_kes,
            #subscription_count=len(subscriptions),
            #top_categories=top_categories
         #)
        #sent_count += 1

    return jsonify({
        "message": f"Sent {sent_count} weekly summaries",
        "emails_sent": sent_count
    }), 200


@cron_bp.route("/health", methods=["GET"])
def cron_health():
    """Health check for cron service."""
    return jsonify({"status": "ok", "service": "cron"}), 200

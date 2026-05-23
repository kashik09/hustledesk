"""
Analytics routes — spending trends, category breakdown,
monthly forecast, and budget status.

All endpoints require JWT auth and are scoped to the current user.
All monetary values returned in KES.
"""
from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.extensions import db
from server.models.subscription import Subscription
from server.models.user import User
from server.models.rate_snapshot import RateSnapshot
from server.services.forecasting import (
    forecast_next_month,
    compute_monthly_spend_kes,
    get_rate_for_currency,
)

analytics_bp = Blueprint("analytics", __name__)


# ── Helper

def get_current_user(user_id: int) -> User | None:
    return User.query.get(int(user_id))


# ── Routes

@analytics_bp.route("/spending-trends", methods=["GET"])
@jwt_required()
def spending_trends():
    """
    GET /api/analytics/spending-trends
    Returns 6 months of monthly KES spend totals for the current user.
    Used by the spending trends chart on the Dashboard.

    Response:
    {
        "months": [
            { "month": "2023-11", "total_kes": 12400.0 },
            { "month": "2023-12", "total_kes": 13100.0 },
            ...
            { "month": "2024-04", "total_kes": 14800.0 },
        ]
    }
    """
    user_id = get_jwt_identity()
    now     = datetime.utcnow()
    months  = []

    # Go back 6 months including current month
    for i in range(5, -1, -1):
        month = now.month - i
        year  = now.year
        while month <= 0:
            month += 12
            year  -= 1

        total_kes = compute_monthly_spend_kes(user_id, year, month)
        months.append({
            "month":     f"{year}-{month:02d}",
            "total_kes": total_kes,
        })

    return jsonify({"months": months}), 200


@analytics_bp.route("/categories", methods=["GET"])
@jwt_required()
def category_breakdown():
    """
    GET /api/analytics/categories
    Returns monthly KES spend broken down by category.
    Used by the category pie chart on the Dashboard.

    Response:
    {
        "categories": [
            { "category": "entertainment",  "total_kes": 4200.0,  "count": 3 },
            { "category": "dev_tools",      "total_kes": 6800.0,  "count": 2 },
            { "category": "productivity",   "total_kes": 3100.0,  "count": 4 },
            ...
        ],
        "total_kes": 14100.0
    }
    """
    user_id = int(get_jwt_identity())
    today   = datetime.utcnow().date()

    subscriptions = Subscription.query.filter_by(user_id=user_id).all()

    # Group by category
    breakdown: dict[str, dict] = {}
    for sub in subscriptions:
        rate = get_rate_for_currency(sub.currency, today)
        kes  = sub.monthly_kes_amount(rate)
        cat  = sub.category

        if cat not in breakdown:
            breakdown[cat] = {"category": cat, "total_kes": 0.0, "count": 0}

        breakdown[cat]["total_kes"] += kes
        breakdown[cat]["count"]     += 1

    # Round totals
    for cat in breakdown:
        breakdown[cat]["total_kes"] = round(breakdown[cat]["total_kes"], 2)

    categories = sorted(
        breakdown.values(),
        key=lambda x: x["total_kes"],
        reverse=True,
    )

    total_kes = round(sum(c["total_kes"] for c in categories), 2)

    return jsonify({
        "categories": categories,
        "total_kes":  total_kes,
    }), 200


@analytics_bp.route("/forecast", methods=["GET"])
@jwt_required()
def monthly_forecast():
    """
    GET /api/analytics/forecast
    Predicts next month's KES spend using a weighted 3-month average.
    Used by the monthly spending forecast component.

    Response:
    {
        "forecast_kes":    14500.0,
        "basis_months":    3,
        "confidence":      "high",
        "monthly_history": [
            { "month": "2024-03", "total_kes": 13200.0 },
            { "month": "2024-02", "total_kes": 14800.0 },
            { "month": "2024-01", "total_kes": 12900.0 },
        ]
    }
    """
    user_id  = get_jwt_identity()
    result   = forecast_next_month(user_id)
    return jsonify(result), 200


@analytics_bp.route("/budget-status", methods=["GET"])
@jwt_required()
def budget_status():
    """
    GET /api/analytics/budget-status
    Compares current monthly KES spend against the user's budget_kes.
    Used by the budget exceeded alert and progress bar on Dashboard.

    Response:
    {
        "budget_kes":   20000.0,    # null if not set
        "spent_kes":    14800.0,    # current month total
        "remaining_kes": 5200.0,   # null if no budget set
        "percent_used":  74.0,      # null if no budget set
        "status": "ok" | "warning" | "exceeded" | "no_budget",
        "message": "You have KES 5,200 left this month."
    }

    Status thresholds:
        ok       < 80% of budget used
        warning  80–99%
        exceeded 100%+
        no_budget user has not set a budget
    """
    user_id = int(get_jwt_identity())
    user    = get_current_user(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    now       = datetime.utcnow()
    spent_kes = compute_monthly_spend_kes(user_id, now.year, now.month)

    # No budget set
    if user.budget_kes is None:
        return jsonify({
            "budget_kes":    None,
            "spent_kes":     spent_kes,
            "remaining_kes": None,
            "percent_used":  None,
            "status":        "no_budget",
            "message":       "Set a monthly budget to track your spending limit.",
        }), 200

    budget        = float(user.budget_kes)
    remaining     = budget - spent_kes
    percent_used  = round((spent_kes / budget) * 100, 1) if budget > 0 else 0.0

    # Determine status
    if percent_used >= 100:
        status  = "exceeded"
        message = (
            f"You've exceeded your monthly budget by "
            f"KES {abs(remaining):,.0f}. Consider pausing a subscription."
        )
    elif percent_used >= 80:
        status  = "warning"
        message = (
            f"You've used {percent_used}% of your budget. "
            f"KES {remaining:,.0f} remaining this month."
        )
    else:
        status  = "ok"
        message = f"You have KES {remaining:,.0f} left this month."

    return jsonify({
        "budget_kes":    budget,
        "spent_kes":     round(spent_kes, 2),
        "remaining_kes": round(remaining, 2),
        "percent_used":  percent_used,
        "status":        status,
        "message":       message,
    }), 200

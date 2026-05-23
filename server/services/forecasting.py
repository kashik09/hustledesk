"""
Forecasting service — predicts next month's subscription spend in KES.

Strategy: weighted average of the last 3 months of actual spend.
Recent months are weighted more heavily so a rate spike last month
matters more than one 3 months ago.

Weights: month-1 = 0.5, month-2 = 0.3, month-3 = 0.2
"""
from datetime import datetime, timedelta
from server.models.subscription import Subscription, CYCLE_TO_MONTHLY
from server.models.rate_snapshot import RateSnapshot
from server.extensions import db


# Weights for the 3-month lookback (most recent first)
WEIGHTS = [0.5, 0.3, 0.2]


def get_rate_for_currency(currency: str, date: datetime.date) -> float:
    """
    Look up the KES rate for a currency on a given date.
    Falls back to the nearest available snapshot if exact date is missing.
    Returns 1.0 if currency is KES (no conversion needed).
    """
    if currency == "KES":
        return 1.0

    # Try exact date first
    snapshot = (
        RateSnapshot.query
        .filter_by(from_currency=currency, to_currency="KES")
        .filter(db.func.date(RateSnapshot.captured_at) == date)
        .first()
    )

    if snapshot:
        return snapshot.rate

    # Fall back to nearest snapshot before the date
    snapshot = (
        RateSnapshot.query
        .filter_by(from_currency=currency, to_currency="KES")
        .filter(RateSnapshot.captured_at <= datetime.combine(date, datetime.min.time()))
        .order_by(RateSnapshot.captured_at.desc())
        .first()
    )

    return snapshot.rate if snapshot else 1.0


def compute_monthly_spend_kes(user_id: int, year: int, month: int) -> float:
    """
    Compute total monthly subscription spend in KES for a given user and month.
    Uses rates from the middle of that month as a representative rate.

    Returns 0.0 if the user has no subscriptions.
    """
    # Use the 15th of the month as representative date for rate lookup
    try:
        rate_date = datetime(year, month, 15).date()
    except ValueError:
        rate_date = datetime.utcnow().date()

    # Get all subscriptions for this user that existed during that month
    # (created_at <= end of month)
    try:
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)
    except ValueError:
        end_of_month = datetime.utcnow()

    subscriptions = (
        Subscription.query
        .filter_by(user_id=user_id)
        .filter(Subscription.created_at < end_of_month)
        .all()
    )

    if not subscriptions:
        return 0.0

    total_kes = 0.0
    for sub in subscriptions:
        rate = get_rate_for_currency(sub.currency, rate_date)
        total_kes += sub.monthly_kes_amount(rate)

    return round(total_kes, 2)


def forecast_next_month(user_id: int) -> dict:
    """
    Predict next month's KES spend using a weighted average of the last 3 months.

    Returns:
    {
        "forecast_kes":     14500.0,   # predicted spend
        "basis_months":     3,         # how many months of data used
        "monthly_history": [           # actual spend for each lookback month
            { "month": "2024-03", "total_kes": 13200.0 },
            { "month": "2024-02", "total_kes": 14800.0 },
            { "month": "2024-01", "total_kes": 12900.0 },
        ],
        "confidence": "high" | "medium" | "low"
        # high = 3 months data, medium = 2, low = 1 or 0
    }
    """
    now = datetime.utcnow()
    history = []

    # Collect last 3 months of actual spend
    for i in range(1, 4):
        # Go back i months from current month
        month = now.month - i
        year  = now.year
        while month <= 0:
            month += 12
            year  -= 1

        total_kes = compute_monthly_spend_kes(user_id, year, month)
        history.append({
            "month":     f"{year}-{month:02d}",
            "total_kes": total_kes,
        })

    # Filter out months with zero spend (user had no subs yet)
    valid = [h for h in history if h["total_kes"] > 0]
    basis = len(valid)

    if basis == 0:
        # No history at all — use current subscriptions at today's rates
        today = now.date()
        subs  = Subscription.query.filter_by(user_id=user_id).all()
        forecast = sum(
            sub.monthly_kes_amount(get_rate_for_currency(sub.currency, today))
            for sub in subs
        )
        confidence = "low"
    else:
        # Weighted average — use available weights trimmed to basis length
        weights = WEIGHTS[:basis]
        # Normalise weights so they sum to 1
        weight_sum  = sum(weights)
        norm_weights = [w / weight_sum for w in weights]

        forecast = sum(
            valid[i]["total_kes"] * norm_weights[i]
            for i in range(basis)
        )

        confidence = {1: "low", 2: "medium", 3: "high"}[basis]

    return {
        "forecast_kes":    round(forecast, 2),
        "basis_months":    basis,
        "monthly_history": history,
        "confidence":      confidence,
    }
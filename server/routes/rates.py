from flask import Blueprint, jsonify, request
from server.extensions import db
from server.models.rate_snapshot import RateSnapshot
from datetime import datetime, timedelta

rates_bp = Blueprint("rates", __name__)

# ── Supported currencies ───────────────────────────────────────────────────────
# The locked 6 for HustleDesk — KES is always the to_currency
SUPPORTED_FROM = {"USD", "EUR", "GBP", "UGX", "TZS"}
BASE_CURRENCY = "KES"

# ── Helper

def validate_currency(code):
    """Return error response if currency is not in the supported set."""
    if code not in SUPPORTED_FROM:
        return jsonify({
            "error": f"Unsupported currency '{code}'. "
                     f"Supported: {sorted(SUPPORTED_FROM)}"
        }), 400
    return None


# ── Routes

@rates_bp.route("/rates/latest", methods=["GET"])
def get_latest():
    """
    GET /api/rates/latest?from=USD
    Returns today's rate for a given currency pair.
    If today's snapshot is missing, rate_fetcher writes it first.

    Response:
    {
        "from_currency": "USD",
        "to_currency":   "KES",
        "rate":          132.45,
        "source":        "open.er-api.com",
        "captured_at":   "2024-04-30T14:22:00"
    }
    """
    from_currency = request.args.get("from", "USD").upper()

    # Validate
    err = validate_currency(from_currency)
    if err:
        return err

    # Try to find today's snapshot
    today = datetime.utcnow().date()
    snapshot = (
        RateSnapshot.query
        .filter_by(from_currency=from_currency, to_currency=BASE_CURRENCY)
        .filter(db.func.date(RateSnapshot.captured_at) == today)
        .first()
    )

    # If missing, fetch from external API and write snapshot
    if not snapshot:
        from server.services.rate_fetcher import fetch_and_store_rate
        snapshot = fetch_and_store_rate(from_currency, BASE_CURRENCY)

    if not snapshot:
        return jsonify({"error": "Could not retrieve rate. Try again later."}), 503

    return jsonify(snapshot.to_dict()), 200


@rates_bp.route("/rates/history", methods=["GET"])
def get_history():
    """
    GET /api/rates/history?from=USD&days=30
    Returns snapshots for the last N days for a currency pair.
    Defaults to 30 days.

    Response:
    {
        "from_currency": "USD",
        "to_currency":   "KES",
        "days":          30,
        "snapshots": [
            { "date": "2024-04-01", "rate": 128.5, "source": "open.er-api.com" },
            ...
        ]
    }
    """
    from_currency = request.args.get("from", "USD").upper()
    days = request.args.get("days", 30, type=int)

    # Validate currency
    err = validate_currency(from_currency)
    if err:
        return err

    # Clamp days to a sensible range
    if days < 1 or days > 365:
        return jsonify({"error": "days must be between 1 and 365"}), 400

    # Compute date window
    since = datetime.utcnow().date() - timedelta(days=days)

    snapshots = (
        RateSnapshot.query
        .filter_by(from_currency=from_currency, to_currency=BASE_CURRENCY)
        .filter(db.func.date(RateSnapshot.captured_at) >= since)
        .order_by(RateSnapshot.captured_at.asc())
        .all()
    )

    return jsonify({
        "from_currency": from_currency,
        "to_currency":   BASE_CURRENCY,
        "days":          days,
        "snapshots": [
            {
                "date":   s.captured_at.strftime("%Y-%m-%d"),
                "rate":   s.rate,
                "source": s.source,
            }
            for s in snapshots
        ]
    }), 200
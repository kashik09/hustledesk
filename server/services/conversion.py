from datetime import datetime
from server.extensions import db
from server.models.rate_snapshot import RateSnapshot
 
# ── Constants 
BASE_CURRENCY = "KES"

# ── Main function called by routes.py 
 
def cross_convert(from_currency: str, to_currency: str, amount: float) -> dict | None:
    """
    Convert any supported currency to any other using KES as the bridge.
 
    Formula:
        If to_currency is KES:
            result = amount × rate_from_to_KES
 
        If both are non-KES (e.g. USD → UGX):
            result = (amount × rate_from_to_KES) / rate_to_to_KES
 
    Example:
        cross_convert("UGX", "KES", 10000)
        → { from: "UGX", to: "KES", amount: 10000, result: 342.5, rate_used: 0.03425 }
 
        cross_convert("USD", "UGX", 100)
        → { from: "USD", to: "UGX", amount: 100, result: 375420.0, rate_used: 3754.2 }
 
    Returns None if rate data is unavailable for either currency.
    """
 
    today = datetime.utcnow().date()
 
    # ── Step 1: get from_currency → KES rate
    if from_currency == BASE_CURRENCY:
        # KES → anything: from rate is 1 (KES is already the base)
        rate_from = 1.0
    else:
        snapshot_from = _get_today_snapshot(from_currency, today)
        if not snapshot_from:
            return None
        rate_from = snapshot_from.rate
 
    # ── Step 2: get to_currency → KES rate
    if to_currency == BASE_CURRENCY:
        # Converting TO KES — no second lookup needed
        rate_to = 1.0
    else:
        snapshot_to = _get_today_snapshot(to_currency, today)
        if not snapshot_to:
            return None
        rate_to = snapshot_to.rate
 
    # ── Step 3: cross-rate math 
    # Both rates are expressed as "1 unit = X KES"
    # So: from_amount in KES = amount × rate_from
    #     result in to_currency = KES_amount / rate_to
    kes_amount = amount * rate_from
    result     = kes_amount / rate_to
 
    # effective rate: how many to_currency units per 1 from_currency unit
    effective_rate = rate_from / rate_to
 
    return {
        "from_currency": from_currency,
        "to_currency":   to_currency,
        "amount":        amount,
        "result":        round(result, 4),
        "rate_used":     round(effective_rate, 6),
        "captured_at":   datetime.utcnow().isoformat(),
    }

# ── Private helper
 
def _get_today_snapshot(from_currency: str, today) -> RateSnapshot | None:
    """
    Look up today's snapshot for from_currency → KES.
    If missing, trigger a live fetch and store via rate_fetcher.
    Returns None if both DB and live fetch fail.
    """
    snapshot = (
        RateSnapshot.query
        .filter_by(from_currency=from_currency, to_currency=BASE_CURRENCY)
        .filter(db.func.date(RateSnapshot.captured_at) == today)
        .first()
    )
 
    if not snapshot:
        # Not in DB yet — fetch live and store
        from server.services.rate_fetcher import fetch_and_store_rate
        snapshot = fetch_and_store_rate(from_currency, BASE_CURRENCY)
 
    return snapshot
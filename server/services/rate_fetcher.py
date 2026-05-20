import requests
from datetime import datetime
from server.extensions import db
from server.models.rate_snapshot import RateSnapshot

# ── External API config ────────────────────────────────────────────────────────
# Primary: open.er-api.com (free, no key needed for basic use)
PRIMARY_URL   = "https://open.er-api.com/v6/latest/{base}"
FALLBACK_URL  = "https://api.frankfurter.app/latest?from={base}&to=KES"

REQUEST_TIMEOUT = 8  # seconds — don't hang the user's request


# ── Main function called by routes.py ──

def fetch_and_store_rate(from_currency: str, to_currency: str = "KES") -> RateSnapshot | None:
    """
    Fetch today's rate for from_currency → to_currency from an external API,
    write it to rate_snapshots if not already there, and return the snapshot.

    Called by GET /api/rates/latest when today's snapshot is missing.
    Returns None if both APIs fail.

    Example:
        snapshot = fetch_and_store_rate("USD", "KES")
        # → RateSnapshot(from="USD", to="KES", rate=132.45, source="open.er-api.com")
    """

    #race condition guard
    today = datetime.utcnow().date()
    existing = (
        RateSnapshot.query
        .filter_by(from_currency=from_currency, to_currency=to_currency)
        .filter(db.func.date(RateSnapshot.captured_at) == today)
        .first()
    )
    if existing:
        return existing

    # Try primary API first, fall back if it fails
    rate, source = _fetch_from_primary(from_currency, to_currency)

    if rate is None:
        rate, source = _fetch_from_fallback(from_currency, to_currency)

    if rate is None:
        # Both APIs failed — return None, routes.py will return 503
        return None

    # Write snapshot to DB
    snapshot = RateSnapshot(
        from_currency=from_currency,
        to_currency=to_currency,
        rate=rate,
        source=source,
        captured_at=datetime.utcnow(),
    )

    try:
        db.session.add(snapshot)
        db.session.commit()
    except Exception:
        # Unique constraint hit (another request beat us to it) — just fetch it
        db.session.rollback()
        return (
            RateSnapshot.query
            .filter_by(from_currency=from_currency, to_currency=to_currency)
            .filter(db.func.date(RateSnapshot.captured_at) == today)
            .first()
        )

    return snapshot


def fetch_last_n_days(from_currency: str, to_currency: str = "KES", days: int = 30) -> list[dict]:
    """
    Fetch historical rates for the last N days from Frankfurter API.
    Used to backfill the rate_snapshots table on first run.

    Returns a list of { date, rate, source } dicts.
    Routes.py doesn't call this directly — it's a utility for seeding/backfill.

    Example:
        rows = fetch_last_n_days("USD", "KES", 30)
    """
    from datetime import timedelta

    end   = datetime.utcnow().date()
    start = end - timedelta(days=days)

    url = (
        f"https://api.frankfurter.app/"
        f"{start}..{end}"
        f"?from={from_currency}&to={to_currency}"
    )

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
    except Exception:
        return []

    results = []
    for date_str, currencies in data.get("rates", {}).items():
        rate = currencies.get(to_currency)
        if rate:
            results.append({
                "date":   date_str,
                "rate":   rate,
                "source": "frankfurter.app",
            })

    return results


# ── Private helpers

def _fetch_from_primary(from_currency: str, to_currency: str):
    """
    Try open.er-api.com.
    Returns (rate, source) or (None, None) on failure.
    """
    url = PRIMARY_URL.format(base=from_currency)

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        rate = data.get("rates", {}).get(to_currency)
        if rate:
            return float(rate), "open.er-api.com"

    except Exception:
        pass

    return None, None


def _fetch_from_fallback(from_currency: str, to_currency: str):
    """
    Try Frankfurter API as fallback.
    Returns (rate, source) or (None, None) on failure.
    """
    url = FALLBACK_URL.format(base=from_currency)

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        rate = data.get("rates", {}).get(to_currency)
        if rate:
            return float(rate), "frankfurter.app"

    except Exception:
        pass

    return None, None
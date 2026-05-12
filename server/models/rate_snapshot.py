from server.extensions import db

from datetime import datetime


class RateSnapshot(db.Model):
    """
    Global FX rate log. One row per currency pair per day.

    Snapshot fetch policy (enforced in rate_fetcher.py):
      - Every request to GET /api/rates/latest writes today's
        snapshot if one doesn't already exist for that pair.
      - This means the table self-populates as users visit the app —
        no cron job needed for Phase 2.

    Example row:
      from_currency = "USD"
      to_currency   = "KES"
      rate          = 132.45
      captured_at   = 2024-04-30 14:22:00
    """

    __tablename__ = "rate_snapshots"

    # ── Columns 
    id            = db.Column(db.Integer, primary_key=True)

    from_currency = db.Column(db.String(3), nullable=False)
    # e.g. "USD", "EUR", "GBP", "UGX", "TZS"
    # KES is always the to_currency for this app — but stored
    # explicitly so the table stays flexible for Phase 3.

    to_currency   = db.Column(db.String(3), nullable=False)
    # e.g. "KES"

    rate          = db.Column(db.Float, nullable=False)
    # mid-market rate: 1 unit of from_currency = rate units of to_currency

    source        = db.Column(db.String(64), nullable=True)
    # e.g. "open.er-api.com" or "exchangerate.host"
    # shown on RateCard as provenance tooltip

    captured_at   = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    # stored as UTC — format for display in rate_fetcher.py

    # ── Unique constraint ─────────────────────────────────────
    # Only one snapshot per pair per day.
    # rate_fetcher checks this before writing a new row.
    __table_args__ = (
        db.UniqueConstraint(
            "from_currency",
            "to_currency",
            db.func.date("captured_at"),
            name="uq_rate_snapshot_pair_day",
        ),
    )
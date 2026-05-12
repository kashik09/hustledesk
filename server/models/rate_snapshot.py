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
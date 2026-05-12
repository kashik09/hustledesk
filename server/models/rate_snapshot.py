from datetime import datetime
from server.extensions import db


class RateSnapshot(db.Model):
    __tablename__ = "rate_snapshots"

    id = db.Column(db.Integer, primary_key=True)
    from_currency = db.Column(db.String(3), nullable=False, index=True)
    to_currency = db.Column(db.String(3), nullable=False, index=True)
    rate = db.Column(db.Numeric(18, 8), nullable=False)
    source = db.Column(db.String(50), nullable=False, default="open.er-api.com")
    captured_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, index=True
    )

    __table_args__ = (
        db.UniqueConstraint(
            "from_currency", "to_currency", "captured_at",
            name="uq_rate_snapshot_pair_time"
        ),
        db.Index(
            "ix_rate_snapshot_pair_time",
            "from_currency", "to_currency", "captured_at"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "from_currency": self.from_currency,
            "to_currency": self.to_currency,
            "rate": float(self.rate),
            "source": self.source,
            "captured_at": self.captured_at.isoformat() if self.captured_at else None,
        }

    def __repr__(self):
        return f"<RateSnapshot {self.from_currency}/{self.to_currency} @ {self.rate}>"

from flask import Blueprint, jsonify, request
from server.extensions import db
from server.models.rate_snapshot import RateSnapshot
from datetime import datetime, timedelta

rates_bp = Blueprint("rates", __name__)

# ── Supported currencies ───────────────────────────────────────────────────────
# The locked 6 for HustleDesk — KES is always the to_currency
SUPPORTED_FROM = {"USD", "EUR", "GBP", "UGX", "TZS"}
BASE_CURRENCY = "KES"
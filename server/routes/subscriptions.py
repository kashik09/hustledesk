"""
Subscription CRUD routes — per-user ownership enforcement.

All endpoints require JWT authentication. Subscriptions are scoped
to the authenticated user — no cross-user access allowed.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import asc, desc
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.extensions import db
from server.models import Subscription

subscriptions_bp = Blueprint("subscriptions", __name__)

# Validation constants
VALID_CURRENCIES = {"USD", "EUR", "GBP", "KES", "UGX", "TZS"}
VALID_BILLING_CYCLES = {"monthly", "annual", "weekly", "daily"}
VALID_CATEGORIES = {
    "productivity",
    "entertainment",
    "dev_tools",
    "marketing",
    "storage",
    "other",
}


def validate_subscription_data(data, partial=False):
    """
    Validate subscription fields.
    Returns (errors, cleaned_data) tuple.
    """
    errors = []
    cleaned = {}

    # Name validation
    if "name" in data:
        name = data.get("name", "").strip()
        if not name:
            errors.append("Name is required")
        elif len(name) > 100:
            errors.append("Name must be 100 characters or less")
        else:
            cleaned["name"] = name
    elif not partial:
        errors.append("Name is required")

    # Amount validation
    if "amount" in data:
        try:
            amount = float(data["amount"])
            if amount < 0:
                errors.append("Amount must be non-negative")
            else:
                cleaned["amount"] = amount
        except (TypeError, ValueError):
            errors.append("Amount must be a number")
    elif not partial:
        errors.append("Amount is required")

    # Currency validation
    if "currency" in data:
        currency = data.get("currency", "").upper()
        if currency not in VALID_CURRENCIES:
            errors.append(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
        else:
            cleaned["currency"] = currency
    elif not partial:
        errors.append("Currency is required")

    # Billing cycle validation (optional, has default)
    if "billing_cycle" in data:
        billing_cycle = data.get("billing_cycle", "").lower()
        if billing_cycle not in VALID_BILLING_CYCLES:
            errors.append(
                f"Billing cycle must be one of: {', '.join(sorted(VALID_BILLING_CYCLES))}"
            )
        else:
            cleaned["billing_cycle"] = billing_cycle

    # Category validation (optional, has default)
    if "category" in data:
        category = data.get("category", "").lower()
        if category not in VALID_CATEGORIES:
            errors.append(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        else:
            cleaned["category"] = category

    return errors, cleaned


# Sort column map — maps the sort_by param value to a model column
_SORT_COLUMNS = {
    "name":   lambda: Subscription.name,
    "amount": lambda: Subscription.amount,
    "date":   lambda: Subscription.created_at,
}


@subscriptions_bp.route("", methods=["GET"])
@jwt_required()
def list_subscriptions():
    """
    GET /api/subscriptions
    Query params:
      page         int     – page number (default 1)
      per_page     int     – page size (default 20, max 100)
      q            str     – case-insensitive name search
      currency     str     – exact currency code filter (USD, EUR, …)
      billing_cycle str    – exact billing cycle filter (monthly, annual, …)
      category     str     – exact category filter
      sort_by      str     – name | amount | date  (default: date)
      sort_dir     str     – asc | desc            (default: desc)
    Returns paginated list of the current user's subscriptions.
    """
    user_id = int(get_jwt_identity())

    # ── Pagination ────────────────────────────────────────────────────────
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1

    try:
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except (TypeError, ValueError):
        per_page = 20

    # ── Build query ───────────────────────────────────────────────────────
    query = Subscription.query.filter_by(user_id=user_id)

    # Search by name (case-insensitive substring)
    q = request.args.get("q", "").strip()
    if q:
        query = query.filter(Subscription.name.ilike(f"%{q}%"))

    # Filter by currency (exact, case-insensitive)
    currency = request.args.get("currency", "").strip().upper()
    if currency and currency in VALID_CURRENCIES:
        query = query.filter(Subscription.currency == currency)

    # Filter by billing cycle (exact)
    billing_cycle = request.args.get("billing_cycle", "").strip().lower()
    if billing_cycle and billing_cycle in VALID_BILLING_CYCLES:
        query = query.filter(Subscription.billing_cycle == billing_cycle)

    # Filter by category (exact) — fixes frontend param that was previously ignored
    category = request.args.get("category", "").strip().lower()
    if category and category in VALID_CATEGORIES:
        query = query.filter(Subscription.category == category)

    # ── Sorting ───────────────────────────────────────────────────────────
    sort_by  = request.args.get("sort_by",  "date").strip().lower()
    sort_dir = request.args.get("sort_dir", "desc").strip().lower()

    col_fn = _SORT_COLUMNS.get(sort_by, _SORT_COLUMNS["date"])
    order_fn = asc if sort_dir == "asc" else desc
    query = query.order_by(order_fn(col_fn()))

    # ── Paginate and return ───────────────────────────────────────────────
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [sub.to_dict() for sub in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "total_pages": pagination.pages,
    }), 200


@subscriptions_bp.route("", methods=["POST"])
@jwt_required()
def create_subscription():
    """
    POST /api/subscriptions
    Body: { name, amount, currency, billing_cycle?, category? }
    Returns 201 + created subscription.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    errors, cleaned = validate_subscription_data(data, partial=False)
    if errors:
        return jsonify({"error": errors[0], "errors": errors}), 400

    # Set defaults for optional fields
    if "billing_cycle" not in cleaned:
        cleaned["billing_cycle"] = "monthly"
    if "category" not in cleaned:
        cleaned["category"] = "other"

    subscription = Subscription(
        user_id=user_id,
        name=cleaned["name"],
        amount=cleaned["amount"],
        currency=cleaned["currency"],
        billing_cycle=cleaned["billing_cycle"],
        category=cleaned["category"],
    )

    db.session.add(subscription)
    db.session.commit()

    return jsonify(subscription.to_dict()), 201


@subscriptions_bp.route("/<int:sub_id>", methods=["GET"])
@jwt_required()
def get_subscription(sub_id):
    """
    GET /api/subscriptions/<id>
    Returns single subscription (must belong to current user).
    404 if not found OR belongs to different user.
    """
    user_id = int(get_jwt_identity())

    subscription = Subscription.query.filter_by(id=sub_id, user_id=user_id).first()

    if not subscription:
        return jsonify({"error": "Subscription not found"}), 404

    return jsonify(subscription.to_dict()), 200


@subscriptions_bp.route("/<int:sub_id>", methods=["PUT"])
@jwt_required()
def update_subscription(sub_id):
    """
    PUT /api/subscriptions/<id>
    Body: partial update of any field.
    404 if not found OR belongs to different user.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    subscription = Subscription.query.filter_by(id=sub_id, user_id=user_id).first()

    if not subscription:
        return jsonify({"error": "Subscription not found"}), 404

    errors, cleaned = validate_subscription_data(data, partial=True)
    if errors:
        return jsonify({"error": errors[0], "errors": errors}), 400

    # Apply updates
    for field, value in cleaned.items():
        setattr(subscription, field, value)

    db.session.commit()

    return jsonify(subscription.to_dict()), 200


@subscriptions_bp.route("/<int:sub_id>", methods=["DELETE"])
@jwt_required()
def delete_subscription(sub_id):
    """
    DELETE /api/subscriptions/<id>
    404 if not found OR belongs to different user.
    Returns 204 No Content.
    """
    user_id = int(get_jwt_identity())

    subscription = Subscription.query.filter_by(id=sub_id, user_id=user_id).first()

    if not subscription:
        return jsonify({"error": "Subscription not found"}), 404

    db.session.delete(subscription)
    db.session.commit()

    return "", 204
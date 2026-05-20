"""
Subscription CRUD routes — per-user ownership enforcement.

All endpoints require JWT authentication. Subscriptions are scoped
to the authenticated user — no cross-user access allowed.
"""
from flask import Blueprint, request, jsonify
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


@subscriptions_bp.route("", methods=["GET"])
@jwt_required()
def list_subscriptions():
    """
    GET /api/subscriptions
    Query params: page (default 1), per_page (default 20, max 100)
    Returns paginated list of current user's subscriptions.
    """
    user_id = int(get_jwt_identity())

    # Parse pagination params
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1

    try:
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except (TypeError, ValueError):
        per_page = 20

    # Query user's subscriptions with pagination
    pagination = (
        Subscription.query.filter_by(user_id=user_id)
        .order_by(Subscription.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

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

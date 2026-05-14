from flask import Blueprint, request, jsonify, abort

from server.extensions import db
from server.models.subscription import Subscription, Category, BillingCycle
from server.utils.auth import login_required, current_user_id

subscriptions_bp = Blueprint("subscriptions", __name__, url_prefix="/api/subscriptions")


ALLOWED_CURRENCIES = {"USD", "EUR", "GBP", "AUD", "CAD", "JPY", "SGD", "INR"}


def _get_owned_sub(sub_id: int) -> Subscription:
    """Return subscription or raise 404/403."""
    sub = Subscription.query.get_or_404(sub_id, description="Subscription not found")
    if sub.user_id != current_user_id():
        abort(403, description="Access denied: not your subscription")
    return sub


def _validate_payload(data: dict, required: bool = True) -> dict:
    """
    Validate and coerce incoming JSON payload.
    When required=False (PATCH-style PUT), only present keys are validated.
    Returns a clean dict ready for model assignment.
    """
    errors = []
    clean = {}

    name = data.get("name")
    if name is not None:
        if not isinstance(name, str) or not name.strip():
            errors.append("name must be a non-empty string")
        else:
            clean["name"] = name.strip()[:120]
    elif required:
        errors.append("name is required")

    amount = data.get("amount")
    if amount is not None:
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
            clean["amount"] = round(amount, 2)
        except (TypeError, ValueError):
            errors.append("amount must be a positive number")
    elif required:
        errors.append("amount is required")

    currency = data.get("currency", "USD" if required else None)
    if currency is not None:
        currency = str(currency).upper()
        if currency not in ALLOWED_CURRENCIES:
            errors.append(f"currency must be one of: {', '.join(sorted(ALLOWED_CURRENCIES))}")
        else:
            clean["currency"] = currency

    billing_cycle = data.get("billing_cycle", "monthly" if required else None)
    if billing_cycle is not None:
        try:
            clean["billing_cycle"] = BillingCycle(billing_cycle)
        except ValueError:
            valid = [e.value for e in BillingCycle]
            errors.append(f"billing_cycle must be one of: {', '.join(valid)}")

    category = data.get("category", "other" if required else None)
    if category is not None:
        try:
            clean["category"] = Category(category)
        except ValueError:
            valid = [e.value for e in Category]
            errors.append(f"category must be one of: {', '.join(valid)}")

    if errors:
        abort(422, description={"errors": errors})

    return clean


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@subscriptions_bp.get("")
@login_required
def list_subscriptions():
    """
    GET /api/subscriptions?page=1&per_page=10&category=dev_tools&currency=USD
    Returns paginated subscriptions belonging to the authenticated user.
    """
    uid = current_user_id()
    page     = request.args.get("page",     1,  type=int)
    per_page = request.args.get("per_page", 10, type=int)
    per_page = min(per_page, 100)  # hard cap

    query = Subscription.query.filter_by(user_id=uid)

    # optional filters
    category = request.args.get("category")
    if category:
        try:
            query = query.filter_by(category=Category(category))
        except ValueError:
            abort(422, description=f"Invalid category: {category}")

    currency = request.args.get("currency")
    if currency:
        query = query.filter_by(currency=currency.upper())

    pagination = query.order_by(Subscription.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "subscriptions": [s.to_dict() for s in pagination.items],
        "meta": {
            "page":       pagination.page,
            "per_page":   pagination.per_page,
            "total":      pagination.total,
            "pages":      pagination.pages,
            "has_next":   pagination.has_next,
            "has_prev":   pagination.has_prev,
        },
    }), 200


@subscriptions_bp.post("")
@login_required
def create_subscription():
    """POST /api/subscriptions"""
    data  = request.get_json(force=True, silent=True) or {}
    clean = _validate_payload(data, required=True)
    clean["user_id"] = current_user_id()

    sub = Subscription(**clean)
    db.session.add(sub)
    db.session.commit()

    return jsonify(sub.to_dict()), 201


@subscriptions_bp.get("/<int:sub_id>")
@login_required
def get_subscription(sub_id: int):
    """GET /api/subscriptions/<id>"""
    sub = _get_owned_sub(sub_id)
    return jsonify(sub.to_dict()), 200


@subscriptions_bp.put("/<int:sub_id>")
@login_required
def update_subscription(sub_id: int):
    """
    PUT /api/subscriptions/<id>
    Behaves like a PATCH: only supplied fields are updated.
    """
    sub  = _get_owned_sub(sub_id)
    data = request.get_json(force=True, silent=True) or {}

    if not data:
        abort(400, description="Request body is empty")

    clean = _validate_payload(data, required=False)

    for field, value in clean.items():
        setattr(sub, field, value)

    db.session.commit()
    return jsonify(sub.to_dict()), 200


@subscriptions_bp.delete("/<int:sub_id>")
@login_required
def delete_subscription(sub_id: int):
    """DELETE /api/subscriptions/<id>"""
    sub = _get_owned_sub(sub_id)
    db.session.delete(sub)
    db.session.commit()
    return jsonify({"deleted": sub_id}), 200
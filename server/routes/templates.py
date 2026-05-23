"""
Subscription template routes — public catalog and admin CRUD.

GET endpoints are public (for autocomplete).
POST/PUT/DELETE require admin authentication.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.extensions import db
from server.models import SubscriptionTemplate
from server.utils.admin_required import admin_required

templates_bp = Blueprint("templates", __name__)

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


@templates_bp.route("", methods=["GET"])
def search_templates():
    """
    GET /api/templates?q=netflix&country=KE&category=entertainment&limit=10
    Public endpoint for autocomplete search.
    """
    q = request.args.get("q", "").strip()
    country = request.args.get("country", "").upper()
    category = request.args.get("category", "").lower()
    limit = min(request.args.get("limit", 10, type=int), 50)

    query = SubscriptionTemplate.query

    if q:
        query = query.filter(SubscriptionTemplate.service_name.ilike(f"%{q}%"))
    if country:
        query = query.filter_by(country_code=country)
    if category:
        query = query.filter_by(category=category)

    templates = query.order_by(SubscriptionTemplate.service_name).limit(limit).all()
    return jsonify([t.to_dict() for t in templates]), 200


@templates_bp.route("/<int:template_id>", methods=["GET"])
def get_template(template_id):
    """GET /api/templates/<id> — single template details."""
    template = SubscriptionTemplate.query.get(template_id)
    if not template:
        return jsonify({"error": "Template not found"}), 404
    return jsonify(template.to_dict()), 200


@templates_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def create_template():
    """POST /api/templates — create new template (admin only)."""
    data = request.get_json() or {}
    errors, cleaned = validate_template_data(data)

    if errors:
        return jsonify({"errors": errors}), 400

    template = SubscriptionTemplate(**cleaned)
    db.session.add(template)
    db.session.commit()

    return jsonify(template.to_dict()), 201


@templates_bp.route("/<int:template_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_template(template_id):
    """PUT /api/templates/<id> — update template (admin only)."""
    template = SubscriptionTemplate.query.get(template_id)
    if not template:
        return jsonify({"error": "Template not found"}), 404

    data = request.get_json() or {}
    errors, cleaned = validate_template_data(data, partial=True)

    if errors:
        return jsonify({"errors": errors}), 400

    for key, value in cleaned.items():
        setattr(template, key, value)

    db.session.commit()
    return jsonify(template.to_dict()), 200


@templates_bp.route("/<int:template_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_template(template_id):
    """DELETE /api/templates/<id> — remove template (admin only)."""
    template = SubscriptionTemplate.query.get(template_id)
    if not template:
        return jsonify({"error": "Template not found"}), 404

    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": "Template deleted"}), 200


def validate_template_data(data, partial=False):
    """
    Validate template fields.
    Returns (errors, cleaned_data) tuple.
    """
    errors = []
    cleaned = {}

    # Service name validation
    if "service_name" in data:
        service_name = data.get("service_name", "").strip()
        if not service_name:
            errors.append("Service name is required")
        elif len(service_name) > 80:
            errors.append("Service name must be 80 characters or less")
        else:
            cleaned["service_name"] = service_name
    elif not partial:
        errors.append("Service name is required")

    # Country code validation
    if "country_code" in data:
        country_code = data.get("country_code", "").upper()
        if len(country_code) != 2:
            errors.append("Country code must be 2 characters")
        else:
            cleaned["country_code"] = country_code
    elif not partial:
        errors.append("Country code is required")

    # Plan name validation
    if "plan_name" in data:
        plan_name = data.get("plan_name", "").strip()
        if not plan_name:
            errors.append("Plan name is required")
        elif len(plan_name) > 80:
            errors.append("Plan name must be 80 characters or less")
        else:
            cleaned["plan_name"] = plan_name
    elif not partial:
        errors.append("Plan name is required")

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

    # Category validation
    if "category" in data:
        category = data.get("category", "").lower()
        if category not in VALID_CATEGORIES:
            errors.append(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        else:
            cleaned["category"] = category
    elif not partial:
        errors.append("Category is required")

    # Billing cycle validation (optional, has default)
    if "billing_cycle" in data:
        billing_cycle = data.get("billing_cycle", "").lower()
        if billing_cycle not in VALID_BILLING_CYCLES:
            errors.append(f"Billing cycle must be one of: {', '.join(sorted(VALID_BILLING_CYCLES))}")
        else:
            cleaned["billing_cycle"] = billing_cycle

    # Pricing tiers validation (optional, JSON)
    if "pricing_tiers" in data:
        pricing_tiers = data.get("pricing_tiers")
        if pricing_tiers is not None and not isinstance(pricing_tiers, list):
            errors.append("Pricing tiers must be a list")
        else:
            cleaned["pricing_tiers"] = pricing_tiers

    # Per-seat pricing validation (optional, boolean)
    if "per_seat_pricing" in data:
        per_seat = data.get("per_seat_pricing")
        if not isinstance(per_seat, bool):
            errors.append("Per-seat pricing must be a boolean")
        else:
            cleaned["per_seat_pricing"] = per_seat

    # Source URL validation (optional)
    if "source_url" in data:
        source_url = data.get("source_url", "").strip()
        if source_url and len(source_url) > 255:
            errors.append("Source URL must be 255 characters or less")
        else:
            cleaned["source_url"] = source_url or None

    return errors, cleaned

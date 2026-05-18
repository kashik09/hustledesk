from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from extensions import db

from models.user import User
from models.subscription_template import SubscriptionTemplate

from utils.admin_required import admin_required


admin_bp = Blueprint("admin", __name__)


# =========================
# GET ALL USERS (PAGINATED)
# =========================
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():

    page = request.args.get("page", 1, type=int)

    per_page = 10

    users = User.query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return jsonify({
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "home_currency": user.home_currency,
                "is_admin": user.is_admin,
                "created_at": user.created_at.isoformat()
                if user.created_at
                else None
            }
            for user in users.items
        ],
        "total": users.total,
        "pages": users.pages,
        "current_page": users.page
    }), 200


# =========================
# DELETE USER
# =========================
@admin_bp.route("/users/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(id):

    user = User.query.get(id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    db.session.delete(user)

    db.session.commit()

    return jsonify({
        "message": "User deleted successfully"
    }), 200


# =========================
# ADMIN STATS
# =========================
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_stats():

    total_users = User.query.count()

    admin_users = User.query.filter_by(
        is_admin=True
    ).count()

    total_templates = SubscriptionTemplate.query.count()

    currencies = db.session.query(
        User.home_currency
    ).distinct().count()

    return jsonify({
        "total_users": total_users,
        "admin_users": admin_users,
        "total_templates": total_templates,
        "supported_currencies": currencies
    }), 200


# =========================
# CREATE TEMPLATE
# =========================
@admin_bp.route("/templates", methods=["POST"])
@jwt_required()
@admin_required
def create_template():

    data = request.get_json()

    template = SubscriptionTemplate(
        name=data["name"],
        category=data.get("category"),
        pricing_tiers=data.get("pricing_tiers"),
        per_seat=data.get("per_seat", False)
    )

    db.session.add(template)

    db.session.commit()

    return jsonify({
        "message": "Template created successfully"
    }), 201


# =========================
# GET ALL TEMPLATES
# =========================
@admin_bp.route("/templates", methods=["GET"])
@jwt_required()
@admin_required
def get_templates():

    templates = SubscriptionTemplate.query.all()

    return jsonify([
        {
            "id": template.id,
            "name": template.name,
            "category": template.category,
            "pricing_tiers": template.pricing_tiers,
            "per_seat": template.per_seat
        }
        for template in templates
    ]), 200


# =========================
# UPDATE TEMPLATE
# =========================
@admin_bp.route("/templates/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_template(id):

    template = SubscriptionTemplate.query.get(id)

    if not template:
        return jsonify({
            "error": "Template not found"
        }), 404

    data = request.get_json()

    template.name = data.get(
        "name",
        template.name
    )

    template.category = data.get(
        "category",
        template.category
    )

    template.pricing_tiers = data.get(
        "pricing_tiers",
        template.pricing_tiers
    )

    template.per_seat = data.get(
        "per_seat",
        template.per_seat
    )

    db.session.commit()

    return jsonify({
        "message": "Template updated successfully"
    }), 200


# =========================
# DELETE TEMPLATE
# =========================
@admin_bp.route("/templates/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_template(id):

    template = SubscriptionTemplate.query.get(id)

    if not template:
        return jsonify({
            "error": "Template not found"
        }), 404

    db.session.delete(template)

    db.session.commit()

    return jsonify({
        "message": "Template deleted successfully"
    }), 200
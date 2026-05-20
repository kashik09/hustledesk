from flask import Blueprint, jsonify

from flask_jwt_extended import jwt_required

from sqlalchemy import func

from server.extensions import db

from server.models.user import User
from server.models.subscription import Subscription
from server.models.subscription_template import SubscriptionTemplate

from server.utils.admin_required import admin_required


admin_bp = Blueprint("admin", __name__)


# =========================
# GET ALL USERS
# =========================
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():

    users = User.query.all()

    return jsonify({
        "users": [user.to_dict() for user in users]
    }), 200


# =========================
# DELETE USER
# =========================
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):

    user = User.query.get(user_id)

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
def get_admin_stats():

    total_users = User.query.count()

    total_subscriptions = Subscription.query.count()

    total_templates = SubscriptionTemplate.query.count()

    categories = (
        db.session.query(
            Subscription.category,
            func.count(Subscription.id)
        )
        .group_by(Subscription.category)
        .all()
    )

    currencies = (
        db.session.query(
            Subscription.currency,
            func.count(Subscription.id)
        )
        .group_by(Subscription.currency)
        .all()
    )

    return jsonify({
        "total_users": total_users,
        "total_subscriptions": total_subscriptions,
        "total_templates": total_templates,
        "categories": [
            {
                "category": c[0],
                "count": c[1]
            }
            for c in categories
        ],
        "currencies": [
            {
                "currency": c[0],
                "count": c[1]
            }
            for c in currencies
        ]
    }), 200
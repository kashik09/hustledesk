from flask import Blueprint, jsonify, request

from models.user import User

from extensions import db

from admin_required import admin_required

admin_bp = Blueprint(
    "admin",
    __name__
)


# =========================
# GET USERS (PAGINATED)
# =========================
@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():

    page = request.args.get(
        "page",
        1,
        type=int
    )

    per_page = request.args.get(
        "per_page",
        10,
        type=int
    )

    pagination = User.query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    users = [
        user.to_dict()
        for user in pagination.items
    ]

    return jsonify({
        "users": users,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


# =========================
# DELETE USER
# =========================
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
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
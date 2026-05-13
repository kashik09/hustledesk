"""
Auth routes — signup, login, me, logout.

MVP endpoints for Friday demo. No email verification, no refresh tokens,
no password reset, no OAuth. Just basic JWT auth.
"""
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from server.extensions import db
from server.models import User

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    POST /api/auth/signup
    Body: { email, password, home_currency? }
    Returns: { access_token, user }
    """
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    home_currency = data.get("home_currency", "KES").upper()

    # Validate email
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email format"}), 400

    # Validate password
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check duplicate
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    # Create user
    user = User(email=email, home_currency=home_currency)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate token (identity must be string for JWT)
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    Returns: { access_token, user } or 401
    """
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    GET /api/auth/me
    Headers: Authorization: Bearer <token>
    Returns: { user }
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    POST /api/auth/logout
    Client-side token deletion. No server state to clear.
    Returns: { message }
    """
    return jsonify({"message": "Logged out successfully"}), 200

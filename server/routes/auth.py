"""
Auth routes — signup, login, me, logout, profile update, password change.

Security features:
- Rate limiting (5/min login, 3/hr signup)
- Password strength validation (8+ chars, uppercase, lowercase, digit)
- Account lockout (5 failed attempts = 15 min lock)
"""
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from server.extensions import db, limiter
from server.models import User, Notification
#from server.utils.email import send_welcome_email
from server.utils.turnstile import verify_turnstile

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ALLOWED_CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"]


def validate_password_strength(password):
    """
    Validate password meets security requirements.
    Returns error message or None if valid.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one digit"
    return None


def validate_username(username):
    """
    Validate username format.
    Returns error message or None if valid.
    """
    if not username:
        return None  # Username is optional
    if len(username) < 3:
        return "Username must be at least 3 characters"
    if len(username) > 50:
        return "Username must be 50 characters or less"
    if not re.match(r"^[a-z0-9_]+$", username):
        return "Username can only contain lowercase letters, numbers, and underscores"
    return None


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("3 per hour")
def signup():
    """
    POST /api/auth/signup
    Body: { email, password, home_currency?, name?, turnstile_token? }
    Returns: { access_token, user }
    """
    data = request.get_json() or {}

    # Verify Turnstile token (if configured)
    turnstile_token = data.get("turnstile_token")
    if not verify_turnstile(turnstile_token, request.remote_addr):
        return jsonify({"error": "Security verification failed. Please try again."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    home_currency = data.get("home_currency", "KES").upper()
    name = data.get("name", "").strip() or None

    # Validate email
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email format"}), 400

    # Validate password strength
    password_error = validate_password_strength(password)
    if password_error:
        return jsonify({"error": password_error}), 400

    # Validate currency
    if home_currency not in ALLOWED_CURRENCIES:
        return jsonify({"error": f"Currency must be one of: {', '.join(ALLOWED_CURRENCIES)}"}), 400

    # Check duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    # Create user
    user = User(email=email, home_currency=home_currency, name=name)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Send welcome email (non-blocking)
   # try:
        #send_welcome_email(email, name)
    #except Exception as e:
       # print(f"[SIGNUP] Welcome email failed: {e}")

    # Create welcome notification
    welcome_notification = Notification(
        user_id=user.id,
        type="welcome",
        title="Welcome to HustleDesk!",
        message="Start tracking your subscriptions and see the true cost in KES."
    )
    db.session.add(welcome_notification)
    db.session.commit()

    # Generate token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    """
    POST /api/auth/login
    Body: { email, password, turnstile_token? }
    Returns: { access_token, user } or 401

    Account lockout: 5 failed attempts = 15 minute lock
    """
    data = request.get_json() or {}

    # Verify Turnstile token (if configured)
    turnstile_token = data.get("turnstile_token")
    if not verify_turnstile(turnstile_token, request.remote_addr):
        return jsonify({"error": "Security verification failed. Please try again."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    # Check if user exists
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Check if account is locked
    if user.is_locked():
        return jsonify({
            "error": "Account temporarily locked due to too many failed login attempts. Try again in 15 minutes."
        }), 403

    # Check password
    if not user.check_password(password):
        # Increment failed login attempts
        user.increment_failed_login()
        db.session.commit()

        remaining = 5 - user.failed_login_attempts
        if remaining > 0:
            return jsonify({
                "error": f"Invalid email or password. {remaining} attempts remaining."
            }), 401
        else:
            return jsonify({
                "error": "Account locked for 15 minutes due to too many failed attempts."
            }), 403

    # Successful login - reset failed attempts
    user.reset_failed_login()
    db.session.commit()

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


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    PUT /api/auth/me
    Headers: Authorization: Bearer <token>
    Body: { name?, username?, home_currency?, budget_kes? }
    Returns: { user }
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    # Update name
    if "name" in data:
        user.name = data["name"].strip() if data["name"] else None

    # Update username
    if "username" in data:
        username = data["username"].strip().lower() if data["username"] else None

        if username:
            # Validate username format
            username_error = validate_username(username)
            if username_error:
                return jsonify({"error": username_error}), 400

            # Check uniqueness (exclude current user)
            existing = User.query.filter(User.username == username, User.id != user.id).first()
            if existing:
                return jsonify({"error": "Username already taken"}), 400

        user.username = username

    # Update home currency
    if "home_currency" in data:
        currency = data["home_currency"].upper()
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({"error": f"Currency must be one of: {', '.join(ALLOWED_CURRENCIES)}"}), 400
        user.home_currency = currency

    # Update budget
    if "budget_kes" in data:
        budget = data["budget_kes"]
        if budget is not None:
            try:
                budget = float(budget)
                if budget < 0:
                    return jsonify({"error": "Budget cannot be negative"}), 400
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid budget value"}), 400
        user.budget_kes = budget

    db.session.commit()

    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    """
    PUT /api/auth/password
    Headers: Authorization: Bearer <token>
    Body: { current_password, new_password }
    Returns: { message }
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Current password and new password required"}), 400

    # Verify current password
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    # Validate new password strength
    password_error = validate_password_strength(new_password)
    if password_error:
        return jsonify({"error": password_error}), 400

    # Don't allow same password
    if current_password == new_password:
        return jsonify({"error": "New password must be different from current password"}), 400

    # Update password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    POST /api/auth/logout
    Client-side token deletion. No server state to clear.
    Returns: { message }
    """
    return jsonify({"message": "Logged out successfully"}), 200

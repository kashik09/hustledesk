from functools import wraps

from flask import jsonify

from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt_identity
)

from server.models.user import User


def admin_required(fn):

    @wraps(fn)
    def wrapper(*args, **kwargs):

        # Verify JWT exists
        verify_jwt_in_request()

        # Get logged-in user ID
        user_id = get_jwt_identity()

        # Find user in database
        user = User.query.get(user_id)

        # User does not exist
        if not user:

            return jsonify({
                "error": "User not found"
            }), 404

        # User is not admin
        if not user.is_admin:

            return jsonify({
                "error": "Admin access required"
            }), 403

        # Allow access
        return fn(*args, **kwargs)

    return wrapper

from flask import (
    Blueprint,
    request,
    jsonify,
)

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
)

from server.extensions import db

from server.models.user import User

from server.utils.auth_helpers import (
    hash_password,
    check_password,
    generate_token,
)

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.post("/signup")
def signup():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        return jsonify({
            "error": "Email already exists"
        }), 400

    new_user = User(
        email=email,
        password_hash=hash_password(password)
    )

    db.session.add(new_user)

    db.session.commit()

    token = generate_token(new_user.id)

    return jsonify({
        "token": token,
        "user": new_user.to_dict()
    }), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    valid_password = check_password(
        password,
        user.password_hash
    )

    if not valid_password:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    token = generate_token(user.id)

    return jsonify({
        "token": token,
        "user": user.to_dict()
    })


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    return jsonify(user.to_dict())


@auth_bp.post("/logout")
def logout():
    return jsonify({
        "message": "Logged out"
    })
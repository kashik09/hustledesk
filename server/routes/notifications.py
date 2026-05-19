"""
Notification routes — list and mark as read.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.extensions import db
from server.models import Notification

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    """
    GET /api/notifications
    Returns: [ { id, type, title, message, read, created_at }, ... ]
    Limited to 20 most recent.
    """
    user_id = get_jwt_identity()

    notifications = Notification.query.filter_by(user_id=int(user_id)) \
        .order_by(Notification.created_at.desc()) \
        .limit(20) \
        .all()

    return jsonify({
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": Notification.query.filter_by(user_id=int(user_id), read=False).count()
    }), 200


@notifications_bp.route("/<int:notification_id>/read", methods=["POST"])
@jwt_required()
def mark_as_read(notification_id):
    """
    POST /api/notifications/:id/read
    Marks a notification as read.
    """
    user_id = get_jwt_identity()

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=int(user_id)
    ).first()

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.read = True
    db.session.commit()

    return jsonify({"message": "Marked as read"}), 200


@notifications_bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_as_read():
    """
    POST /api/notifications/read-all
    Marks all user's notifications as read.
    """
    user_id = get_jwt_identity()

    Notification.query.filter_by(user_id=int(user_id), read=False) \
        .update({"read": True})
    db.session.commit()

    return jsonify({"message": "All notifications marked as read"}), 200

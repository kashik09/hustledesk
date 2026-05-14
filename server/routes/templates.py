from flask import Blueprint, request, jsonify
from server.models.subscription_template import SubscriptionTemplate

templates_bp = Blueprint("templates", __name__)

@templates_bp.route("/api/templates", methods=["GET"])
def get_templates():
    service = request.args.get("service")
    country = request.args.get("country")

    query = SubscriptionTemplate.query

    if service:
        query = query.filter_by(service=service)

    if country:
        query = query.filter_by(country=country)

    templates = query.all()

    return jsonify([t.to_dict() for t in templates])
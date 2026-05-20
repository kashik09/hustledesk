from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.extensions import db

from server.models.subscription_template import SubscriptionTemplate

from server.utils.admin_required import admin_required


admin_templates_bp = Blueprint(
    "admin_templates",
    __name__
)

# GET ALL TEMPLATES
@admin_templates_bp.route(
    "/templates",
    methods=["GET"]
)
@jwt_required()
@admin_required
def get_templates():

    templates = SubscriptionTemplate.query.all()

    return jsonify([
        template.to_dict()
        for template in templates
    ]), 200

# CREATE TEMPLATE
@admin_templates_bp.route(
    "/templates",
    methods=["POST"]
)
@jwt_required()
@admin_required
def create_template():

    data = request.get_json()

    template = SubscriptionTemplate(
        category=data["category"],
        service_name=data["service_name"],
        country_code=data["country_code"],
        plan_name=data["plan_name"],
        amount=data["amount"],
        currency=data["currency"],
        billing_cycle=data["billing_cycle"],
        source_url=data.get("source_url")
    )

    db.session.add(template)
    db.session.commit()

    return jsonify(
        template.to_dict()
    ), 201

# DELETE TEMPLATE
@admin_templates_bp.route(
    "/templates/<int:template_id>",
    methods=["DELETE"]
)
@jwt_required()
@admin_required
def delete_template(template_id):

    template = SubscriptionTemplate.query.get(template_id)

    if not template:
        return jsonify({
            "error": "Template not found"
        }), 404

    db.session.delete(template)
    db.session.commit()

    return jsonify({
        "message": "Template deleted"
    }), 200
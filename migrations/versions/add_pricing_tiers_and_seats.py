"""Add pricing_tiers, per_seat_pricing, and seats columns

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add pricing_tiers and per_seat_pricing to subscription_templates
    if not column_exists('subscription_templates', 'pricing_tiers'):
        op.add_column('subscription_templates', sa.Column('pricing_tiers', sa.JSON(), nullable=True))
    if not column_exists('subscription_templates', 'per_seat_pricing'):
        op.add_column('subscription_templates', sa.Column('per_seat_pricing', sa.Boolean(), server_default='0', nullable=True))

    # Add seats to subscriptions
    if not column_exists('subscriptions', 'seats'):
        op.add_column('subscriptions', sa.Column('seats', sa.Integer(), server_default='1', nullable=True))


def downgrade():
    if column_exists('subscriptions', 'seats'):
        op.drop_column('subscriptions', 'seats')
    if column_exists('subscription_templates', 'per_seat_pricing'):
        op.drop_column('subscription_templates', 'per_seat_pricing')
    if column_exists('subscription_templates', 'pricing_tiers'):
        op.drop_column('subscription_templates', 'pricing_tiers')

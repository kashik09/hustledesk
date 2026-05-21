"""Add user profile fields and notifications table

Revision ID: a1b2c3d4e5f6
Revises: 342f1b2eeb44
Create Date: 2026-05-21

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '342f1b2eeb44'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to users table
    op.add_column('users', sa.Column('name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), server_default='0', nullable=True))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(), nullable=True))

    # Create unique index on username
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('read', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)


def downgrade():
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'is_admin')
    op.drop_column('users', 'username')
    op.drop_column('users', 'name')

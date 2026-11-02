"""customer pseudo (unique, case-insensitive) and its snapshot on orders

Revision ID: 8c41d2e7a9b3
Revises: 3f9a1c7d2b84
Create Date: 2026-11-02 18:00:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8c41d2e7a9b3'
down_revision = '3f9a1c7d2b84'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user', sa.Column('pseudo', sa.String(length=30), nullable=True))
    op.create_index('ix_user_pseudo_lower', 'user', [sa.text('lower(pseudo)')], unique=True)
    op.add_column('customer_order', sa.Column('customer_pseudo', sa.String(length=30), nullable=True))


def downgrade():
    op.drop_column('customer_order', 'customer_pseudo')
    op.drop_index('ix_user_pseudo_lower', table_name='user')
    op.drop_column('user', 'pseudo')

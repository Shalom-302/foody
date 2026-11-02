"""customer reviews and admin-edited delivery settings

Revision ID: 5e2b7c9d1a40
Revises: 8c41d2e7a9b3
Create Date: 2026-11-02 19:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5e2b7c9d1a40'
down_revision = '8c41d2e7a9b3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('testimonial',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('author', sa.String(length=80), nullable=False),
    sa.Column('quote', sa.String(length=400), nullable=False),
    sa.Column('location', sa.String(length=80), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_testimonial_id'), 'testimonial', ['id'], unique=False)
    op.create_table('shop_settings',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('delivery_fee', sa.Integer(), nullable=False),
    sa.Column('free_delivery_threshold', sa.Integer(), server_default='0', nullable=False),
    sa.Column('pickup_address', sa.String(length=300), nullable=True),
    sa.Column('communes', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shop_settings_id'), 'shop_settings', ['id'], unique=False)


def downgrade():
    op.drop_table('shop_settings')
    op.drop_table('testimonial')

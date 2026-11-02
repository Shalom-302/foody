"""shop: catalogue, orders, WhatsApp customers

Revision ID: 3f9a1c7d2b84
Revises: 64524c63b666
Create Date: 2026-11-02 16:00:00

- user: email/password become optional (customers log in with WhatsApp OTP),
  phone becomes unique, new full_name column.
- category, product, customer_order, order_item tables.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3f9a1c7d2b84'
down_revision = '64524c63b666'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user', sa.Column('full_name', sa.String(length=120), nullable=True))
    op.alter_column('user', 'email', existing_type=sa.String(length=200), nullable=True)
    op.alter_column('user', 'password', existing_type=sa.String(), nullable=True)
    op.alter_column('user', 'phone', existing_type=sa.String(), type_=sa.String(length=20), existing_nullable=True)
    op.drop_index('ix_user_phone', table_name='user')
    op.create_index(op.f('ix_user_phone'), 'user', ['phone'], unique=True)

    op.create_table('category',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('slug', sa.String(length=140), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_category_id'), 'category', ['id'], unique=False)
    op.create_index(op.f('ix_category_slug'), 'category', ['slug'], unique=True)

    op.create_table('product',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('category_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=160), nullable=False),
    sa.Column('slug', sa.String(length=180), nullable=False),
    sa.Column('price', sa.Integer(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('stock', sa.Integer(), server_default='0', nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('gallery', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
    sa.Column('model_3d_url', sa.String(length=500), nullable=True),
    sa.Column('volume', sa.String(length=60), nullable=True),
    sa.Column('ingredients', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('is_featured', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.CheckConstraint('price >= 0', name='ck_product_price_positive'),
    sa.CheckConstraint('stock >= 0', name='ck_product_stock_positive'),
    sa.ForeignKeyConstraint(['category_id'], ['category.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_category_id'), 'product', ['category_id'], unique=False)
    op.create_index(op.f('ix_product_id'), 'product', ['id'], unique=False)
    op.create_index(op.f('ix_product_slug'), 'product', ['slug'], unique=True)

    op.create_table('customer_order',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('order_number', sa.String(length=20), nullable=False),
    sa.Column('subtotal', sa.Integer(), nullable=False),
    sa.Column('delivery_fee', sa.Integer(), nullable=False),
    sa.Column('total', sa.Integer(), nullable=False),
    sa.Column('customer_name', sa.String(length=120), nullable=False),
    sa.Column('customer_phone', sa.String(length=20), nullable=False),
    sa.Column('delivery_method', sa.String(length=20), nullable=False),
    sa.Column('payment_method', sa.String(length=20), nullable=False),
    sa.Column('delivery_address', sa.String(length=300), nullable=True),
    sa.Column('delivery_commune', sa.String(length=60), nullable=True),
    sa.Column('delivery_instructions', sa.String(length=500), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('payment_status', sa.String(length=20), server_default='pending', nullable=False),
    sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_order_customer_phone'), 'customer_order', ['customer_phone'], unique=False)
    op.create_index(op.f('ix_customer_order_id'), 'customer_order', ['id'], unique=False)
    op.create_index(op.f('ix_customer_order_order_number'), 'customer_order', ['order_number'], unique=True)
    op.create_index(op.f('ix_customer_order_status'), 'customer_order', ['status'], unique=False)
    op.create_index(op.f('ix_customer_order_user_id'), 'customer_order', ['user_id'], unique=False)

    op.create_table('order_item',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, comment='Primary key id'),
    sa.Column('order_id', sa.Integer(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=True),
    sa.Column('product_name', sa.String(length=160), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('unit_price', sa.Integer(), nullable=False),
    sa.Column('subtotal', sa.Integer(), nullable=False),
    sa.Column('created_time', sa.DateTime(timezone=True), nullable=False, comment='Creation time'),
    sa.Column('updated_time', sa.DateTime(timezone=True), nullable=True, comment='update time'),
    sa.ForeignKeyConstraint(['order_id'], ['customer_order.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['product_id'], ['product.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_item_id'), 'order_item', ['id'], unique=False)
    op.create_index(op.f('ix_order_item_order_id'), 'order_item', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_item_product_id'), 'order_item', ['product_id'], unique=False)


def downgrade():
    op.drop_table('order_item')
    op.drop_table('customer_order')
    op.drop_table('product')
    op.drop_table('category')
    op.drop_index(op.f('ix_user_phone'), table_name='user')
    op.create_index('ix_user_phone', 'user', ['phone'], unique=False)
    op.alter_column('user', 'phone', existing_type=sa.String(length=20), type_=sa.String(), existing_nullable=True)
    op.alter_column('user', 'password', existing_type=sa.String(), nullable=False)
    op.alter_column('user', 'email', existing_type=sa.String(length=200), nullable=False)
    op.drop_column('user', 'full_name')

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.common.enums import OrderStatus, PaymentStatus
from backend.common.model import Base, id_key


class Order(Base):
    """A customer order. Every amount is computed server-side, in FCFA."""

    __tablename__ = 'customer_order'

    id: Mapped[id_key] = mapped_column(init=False)
    user_id: Mapped[int | None] = mapped_column(sa.ForeignKey('user.id', ondelete='SET NULL'), index=True)
    order_number: Mapped[str] = mapped_column(sa.String(20), unique=True, index=True)
    subtotal: Mapped[int] = mapped_column(sa.Integer)
    delivery_fee: Mapped[int] = mapped_column(sa.Integer)
    total: Mapped[int] = mapped_column(sa.Integer)
    # Contact snapshot: the order keeps who to call even if the profile changes.
    customer_name: Mapped[str] = mapped_column(sa.String(120))
    customer_phone: Mapped[str] = mapped_column(sa.String(20), index=True)
    delivery_method: Mapped[str] = mapped_column(sa.String(20))
    payment_method: Mapped[str] = mapped_column(sa.String(20))
    # The customer's pseudo when the order was placed (what the shop displays).
    customer_pseudo: Mapped[str | None] = mapped_column(sa.String(30), default=None)
    delivery_address: Mapped[str | None] = mapped_column(sa.String(300), default=None)
    delivery_commune: Mapped[str | None] = mapped_column(sa.String(60), default=None)
    delivery_instructions: Mapped[str | None] = mapped_column(sa.String(500), default=None)
    notes: Mapped[str | None] = mapped_column(sa.Text, default=None)
    payment_status: Mapped[str] = mapped_column(
        sa.String(20), default=PaymentStatus.PENDING.value, server_default=PaymentStatus.PENDING.value
    )
    status: Mapped[str] = mapped_column(
        sa.String(20), index=True, default=OrderStatus.PENDING.value, server_default=OrderStatus.PENDING.value
    )

    items: Mapped[list['OrderItem']] = relationship(
        init=False, lazy='selectin', cascade='all, delete-orphan', back_populates='order'
    )


class OrderItem(Base):
    __tablename__ = 'order_item'

    id: Mapped[id_key] = mapped_column(init=False)
    order_id: Mapped[int] = mapped_column(
        sa.ForeignKey('customer_order.id', ondelete='CASCADE'), index=True, init=False
    )
    # SET NULL: deleting a product from the catalogue keeps the order history.
    product_id: Mapped[int | None] = mapped_column(sa.ForeignKey('product.id', ondelete='SET NULL'), index=True)
    product_name: Mapped[str] = mapped_column(sa.String(160))
    quantity: Mapped[int] = mapped_column(sa.Integer)
    unit_price: Mapped[int] = mapped_column(sa.Integer)
    subtotal: Mapped[int] = mapped_column(sa.Integer)

    order: Mapped[Order] = relationship(init=False, back_populates='items', lazy='noload')

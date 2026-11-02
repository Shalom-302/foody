import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.common.model import Base, id_key
from backend.models.category import Category


class Product(Base):
    """A shop product. ``price`` is an integer number of FCFA."""

    __tablename__ = 'product'
    __table_args__ = (
        sa.CheckConstraint('price >= 0', name='ck_product_price_positive'),
        sa.CheckConstraint('stock >= 0', name='ck_product_stock_positive'),
    )

    id: Mapped[id_key] = mapped_column(init=False)
    category_id: Mapped[int] = mapped_column(sa.ForeignKey('category.id', ondelete='RESTRICT'), index=True)
    name: Mapped[str] = mapped_column(sa.String(160))
    slug: Mapped[str] = mapped_column(sa.String(180), unique=True, index=True)
    price: Mapped[int] = mapped_column(sa.Integer)
    description: Mapped[str | None] = mapped_column(sa.Text, default=None)
    stock: Mapped[int] = mapped_column(sa.Integer, default=0, server_default='0')
    image_url: Mapped[str | None] = mapped_column(sa.String(500), default=None)
    gallery: Mapped[list[str]] = mapped_column(JSONB, default_factory=list, server_default='[]')
    model_3d_url: Mapped[str | None] = mapped_column(sa.String(500), default=None)
    volume: Mapped[str | None] = mapped_column(sa.String(60), default=None)  # "33 cl", "boîte de 6"
    ingredients: Mapped[str | None] = mapped_column(sa.Text, default=None)
    # Hidden from the shop when False ("désactiver un produit"). Whether it can
    # be ordered also depends on the stock: see ``is_available`` in the schema.
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, server_default=sa.true())
    is_featured: Mapped[bool] = mapped_column(sa.Boolean, default=False, server_default=sa.false())

    category: Mapped[Category] = relationship(init=False, lazy='selectin')

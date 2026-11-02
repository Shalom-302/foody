import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from backend.common.model import Base, id_key


class Category(Base):
    """Shop category (Jus de bissap, Mini-cakes, Coffrets gourmands...)."""

    __tablename__ = 'category'

    id: Mapped[id_key] = mapped_column(init=False)
    name: Mapped[str] = mapped_column(sa.String(120))
    slug: Mapped[str] = mapped_column(sa.String(140), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(sa.Text, default=None)
    image_url: Mapped[str | None] = mapped_column(sa.String(500), default=None)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, server_default=sa.true())
    sort_order: Mapped[int] = mapped_column(sa.Integer, default=0, server_default='0')

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from backend.common.model import Base, id_key


class Testimonial(Base):
    """A real customer review, entered from /admin/avis and shown on the home page."""

    __tablename__ = 'testimonial'

    id: Mapped[id_key] = mapped_column(init=False)
    author: Mapped[str] = mapped_column(sa.String(80))
    quote: Mapped[str] = mapped_column(sa.String(400))
    location: Mapped[str | None] = mapped_column(sa.String(80), default=None)  # "Cocody"
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True, server_default=sa.true())
    sort_order: Mapped[int] = mapped_column(sa.Integer, default=0, server_default='0')

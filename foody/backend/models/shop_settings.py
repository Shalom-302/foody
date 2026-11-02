import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from backend.common.model import Base, id_key


class ShopSettings(Base):
    """Delivery settings edited from /admin/reglages (a single row, id 1).

    Until the row exists the values of core/conf.py (env) apply, see
    shop_settings_service.
    """

    __tablename__ = 'shop_settings'

    id: Mapped[id_key] = mapped_column(init=False)
    delivery_fee: Mapped[int] = mapped_column(sa.Integer)
    free_delivery_threshold: Mapped[int] = mapped_column(sa.Integer, default=0, server_default='0')
    pickup_address: Mapped[str | None] = mapped_column(sa.String(300), default=None)
    communes: Mapped[list[str]] = mapped_column(JSONB, default_factory=list, server_default='[]')

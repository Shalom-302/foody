"""Delivery settings: the admin-edited row when it exists, the env defaults otherwise."""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.conf import settings
from backend.database.db_postgres import async_db_session
from backend.models.shop_settings import ShopSettings


@dataclass
class DeliverySettings:
    delivery_fee: int
    free_delivery_threshold: int
    pickup_address: str | None
    communes: list[str]


async def get_delivery_settings(db: AsyncSession | None = None) -> DeliverySettings:
    async def read(session: AsyncSession) -> ShopSettings | None:
        return (await session.execute(select(ShopSettings).order_by(ShopSettings.id).limit(1))).scalars().first()

    if db is not None:
        row = await read(db)
    else:
        async with async_db_session() as session:
            row = await read(session)
    if row is None:
        return DeliverySettings(
            delivery_fee=settings.DELIVERY_FEE,
            free_delivery_threshold=settings.FREE_DELIVERY_THRESHOLD,
            pickup_address=settings.PICKUP_ADDRESS or None,
            communes=list(settings.DELIVERY_COMMUNES),
        )
    return DeliverySettings(
        delivery_fee=row.delivery_fee,
        free_delivery_threshold=row.free_delivery_threshold,
        pickup_address=row.pickup_address,
        communes=list(row.communes or settings.DELIVERY_COMMUNES),
    )


async def save_delivery_settings(values: DeliverySettings) -> DeliverySettings:
    async with async_db_session.begin() as db:
        row = (await db.execute(select(ShopSettings).order_by(ShopSettings.id).limit(1))).scalars().first()
        if row is None:
            row = ShopSettings(delivery_fee=values.delivery_fee)
            db.add(row)
        row.delivery_fee = values.delivery_fee
        row.free_delivery_threshold = values.free_delivery_threshold
        row.pickup_address = values.pickup_address
        row.communes = values.communes
    return values

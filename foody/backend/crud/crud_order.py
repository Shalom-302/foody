from datetime import date, datetime, time, timedelta

from sqlalchemy import Select, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.crud.crud_base import CRUDBase
from backend.models.order import Order
from backend.utils.timezone import timezone


def day_bounds(date_from: date | None, date_to: date | None) -> tuple[datetime | None, datetime | None]:
    """Inclusive local-day range (Africa/Abidjan) -> [start, end) datetimes."""
    tz = timezone.tz_info
    start = datetime.combine(date_from, time.min, tzinfo=tz) if date_from else None
    end = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=tz) if date_to else None
    return start, end


class CRUDOrder(CRUDBase[Order]):
    def get_user_list(self, user_id: int) -> Select:
        return select(self.model).where(self.model.user_id == user_id).order_by(desc(self.model.id))

    def get_admin_list(
        self,
        *,
        status: str | None = None,
        q: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> Select:
        stmt = select(self.model).order_by(desc(self.model.id))
        if status:
            stmt = stmt.where(self.model.status == status)
        if q:
            pattern = f'%{q.strip()}%'
            stmt = stmt.where(or_(
                self.model.order_number.ilike(pattern),
                self.model.customer_phone.like(pattern),
                self.model.customer_name.ilike(pattern),
            ))
        start, end = day_bounds(date_from, date_to)
        if start:
            stmt = stmt.where(self.model.created_time >= start)
        if end:
            stmt = stmt.where(self.model.created_time < end)
        return stmt

    async def get_for_update(self, db: AsyncSession, pk: int) -> Order | None:
        stmt = select(self.model).where(self.model.id == pk).with_for_update()
        return (await db.execute(stmt)).scalars().first()

    async def number_exists(self, db: AsyncSession, number: str) -> bool:
        return await self.select_model_by_column(db, order_number=number) is not None


order_dao: CRUDOrder = CRUDOrder(Order)

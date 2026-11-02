from sqlalchemy import Select, asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.crud.crud_base import CRUDBase
from backend.models.category import Category
from backend.models.product import Product


class CRUDCategory(CRUDBase[Category]):
    def get_list(self, *, active_only: bool) -> Select:
        stmt = select(self.model).order_by(asc(self.model.sort_order), asc(self.model.name))
        if active_only:
            stmt = stmt.where(self.model.is_active.is_(True))
        return stmt

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Category | None:
        return await self.select_model_by_column(db, slug=slug)


class CRUDProduct(CRUDBase[Product]):
    def get_list(
        self,
        *,
        public: bool,
        category: str | None = None,
        q: str | None = None,
        available: bool | None = None,
        featured: bool | None = None,
        sort: str | None = None,
    ) -> Select:
        stmt = select(self.model).join(Category, Category.id == self.model.category_id)
        if public:
            stmt = stmt.where(self.model.is_active.is_(True), Category.is_active.is_(True))
        if category:
            stmt = stmt.where(Category.slug == category)
        if q:
            pattern = f'%{q.strip()}%'
            stmt = stmt.where(or_(
                self.model.name.ilike(pattern),
                self.model.description.ilike(pattern),
                self.model.ingredients.ilike(pattern),
            ))
        if available is True:
            stmt = stmt.where(self.model.is_active.is_(True), self.model.stock > 0)
        elif available is False:
            stmt = stmt.where(or_(self.model.is_active.is_(False), self.model.stock <= 0))
        if featured is not None:
            stmt = stmt.where(self.model.is_featured.is_(featured))
        order = {
            'price_asc': (asc(self.model.price),),
            'price_desc': (desc(self.model.price),),
            'name': (asc(self.model.name),),
        }.get(sort or '', (desc(self.model.is_featured), desc(self.model.created_time)))
        return stmt.order_by(*order, asc(self.model.id))

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Product | None:
        return await self.select_model_by_column(db, slug=slug)

    async def lock_many(self, db: AsyncSession, ids: list[int]) -> dict[int, Product]:
        """Row-lock the products of an order so two checkouts can't oversell."""
        stmt = select(self.model).where(self.model.id.in_(ids)).order_by(self.model.id).with_for_update()
        return {p.id: p for p in (await db.execute(stmt)).scalars()}


category_dao: CRUDCategory = CRUDCategory(Category)
product_dao: CRUDProduct = CRUDProduct(Product)

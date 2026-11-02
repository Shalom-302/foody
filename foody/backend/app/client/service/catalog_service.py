from sqlalchemy import func, select

from backend.app.client.schema.catalog import (
    CreateCategoryParam,
    CreateProductParam,
    UpdateCategoryParam,
    UpdateProductParam,
)
from backend.common.exception import errors
from backend.crud.crud_catalog import category_dao, product_dao
from backend.database.db_postgres import async_db_session
from backend.models.category import Category
from backend.models.product import Product
from backend.utils.slug import slugify

# Columns that cannot be NULL: an explicit null in a PATCH means "unchanged".
_PRODUCT_NOT_NULL = {'category_id', 'name', 'price', 'stock', 'gallery', 'is_active', 'is_featured'}
_CATEGORY_NOT_NULL = {'name', 'slug', 'is_active', 'sort_order'}


class CatalogService:
    # --- Categories -------------------------------------------------------

    @staticmethod
    async def create_category(*, obj: CreateCategoryParam) -> Category:
        async with async_db_session.begin() as db:
            slug = obj.slug or slugify(obj.name)
            if await category_dao.get_by_slug(db, slug):
                raise errors.ForbiddenError(msg='Une catégorie utilise déjà ce slug.')
            category = Category(**obj.model_dump(exclude={'slug'}), slug=slug)
            db.add(category)
            await db.flush()
            await db.refresh(category)
            return category

    @staticmethod
    async def update_category(*, pk: int, obj: UpdateCategoryParam) -> Category:
        async with async_db_session.begin() as db:
            category = await category_dao.select_model(db, pk)
            if not category:
                raise errors.NotFoundError(msg='Catégorie introuvable.')
            data = obj.model_dump(exclude_unset=True)
            if data.get('slug') and data['slug'] != category.slug and await category_dao.get_by_slug(db, data['slug']):
                raise errors.ForbiddenError(msg='Une catégorie utilise déjà ce slug.')
            for key, value in data.items():
                if value is None and key in _CATEGORY_NOT_NULL:
                    continue
                setattr(category, key, value)
            await db.flush()
            await db.refresh(category)
            return category

    @staticmethod
    async def delete_category(*, pk: int) -> None:
        async with async_db_session.begin() as db:
            category = await category_dao.select_model(db, pk)
            if not category:
                raise errors.NotFoundError(msg='Catégorie introuvable.')
            count = await db.scalar(select(func.count(Product.id)).where(Product.category_id == pk))
            if count:
                raise errors.ForbiddenError(
                    msg=f"Cette catégorie contient encore {count} produit(s) : déplacez-les ou supprimez-les d'abord.")
            await db.delete(category)

    # --- Products ---------------------------------------------------------

    @staticmethod
    async def get_public_product(*, slug: str) -> Product:
        async with async_db_session() as db:
            product = await product_dao.get_by_slug(db, slug)
        if not product or not product.is_active or not product.category.is_active:
            raise errors.NotFoundError(msg='Produit introuvable.')
        return product

    @staticmethod
    async def get_product(*, pk: int) -> Product:
        async with async_db_session() as db:
            product = await product_dao.select_model(db, pk)
        if not product:
            raise errors.NotFoundError(msg='Produit introuvable.')
        return product

    @staticmethod
    async def create_product(*, obj: CreateProductParam) -> Product:
        async with async_db_session.begin() as db:
            if not await category_dao.select_model(db, obj.category_id):
                raise errors.NotFoundError(msg='Catégorie introuvable.')
            slug = obj.slug or slugify(obj.name)
            if await product_dao.get_by_slug(db, slug):
                raise errors.ForbiddenError(msg='Un produit utilise déjà ce slug.')
            product = Product(**obj.model_dump(exclude={'slug'}), slug=slug)
            db.add(product)
            await db.flush()
            await db.refresh(product)
            return product

    @staticmethod
    async def update_product(*, pk: int, obj: UpdateProductParam) -> Product:
        async with async_db_session.begin() as db:
            product = await product_dao.select_model(db, pk)
            if not product:
                raise errors.NotFoundError(msg='Produit introuvable.')
            data = obj.model_dump(exclude_unset=True)
            if data.get('category_id') and not await category_dao.select_model(db, data['category_id']):
                raise errors.NotFoundError(msg='Catégorie introuvable.')
            if data.get('slug') and data['slug'] != product.slug and await product_dao.get_by_slug(db, data['slug']):
                raise errors.ForbiddenError(msg='Un produit utilise déjà ce slug.')
            for key, value in data.items():
                if value is None and key in _PRODUCT_NOT_NULL:
                    continue
                setattr(product, key, value)
            await db.flush()
            await db.refresh(product)
            return product

    @staticmethod
    async def delete_product(*, pk: int) -> None:
        async with async_db_session.begin() as db:
            product = await product_dao.select_model(db, pk)
            if not product:
                raise errors.NotFoundError(msg='Produit introuvable.')
            # Order lines keep their name/price snapshot (product_id -> NULL).
            await db.delete(product)


catalog_service: CatalogService = CatalogService()

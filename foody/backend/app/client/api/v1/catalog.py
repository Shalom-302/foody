from typing import Annotated, Literal

from fastapi import APIRouter, Path, Query, Request

from backend.app.client.schema.catalog import (
    CreateCategoryParam,
    CreateProductParam,
    GetCategoryDetail,
    GetProductDetail,
    UpdateCategoryParam,
    UpdateProductParam,
)
from backend.app.client.service.catalog_service import catalog_service
from backend.common.pagination import DependsPagination, paging_data
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.security.permissions import DependsAdmin
from backend.crud.crud_catalog import category_dao, product_dao
from backend.database.db_postgres import CurrentSession

router = APIRouter(tags=['Catalogue'])

ProductSort = Literal['price_asc', 'price_desc', 'name', 'newest']


@router.get('/categories', summary='Active categories')
async def list_categories(request: Request, db: CurrentSession) -> ResponseModel:
    rows = (await db.execute(category_dao.get_list(active_only=True))).scalars().all()
    data = [GetCategoryDetail.model_validate(c) for c in rows]
    return response_base.success(request=request, data=data)


@router.post('/categories', summary='Create a category', dependencies=[DependsAdmin])
async def create_category(request: Request, obj: CreateCategoryParam) -> ResponseModel:
    category = await catalog_service.create_category(obj=obj)
    return response_base.success(request=request, data=GetCategoryDetail.model_validate(category))


@router.patch('/categories/{pk}', summary='Update a category', dependencies=[DependsAdmin])
async def update_category(request: Request, pk: Annotated[int, Path()], obj: UpdateCategoryParam) -> ResponseModel:
    category = await catalog_service.update_category(pk=pk, obj=obj)
    return response_base.success(request=request, data=GetCategoryDetail.model_validate(category))


@router.get('/products', summary='Shop products (paginated)', dependencies=[DependsPagination])
async def list_products(
    request: Request,
    db: CurrentSession,
    category: Annotated[str | None, Query(description='Category slug')] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    available: Annotated[bool | None, Query(description='In stock only')] = None,
    featured: Annotated[bool | None, Query()] = None,
    sort: Annotated[ProductSort | None, Query()] = None,
) -> ResponseModel:
    stmt = product_dao.get_list(public=True, category=category, q=q, available=available, featured=featured, sort=sort)
    data = await paging_data(db, stmt, GetProductDetail)
    return response_base.success(request=request, data=data)


@router.get('/products/{slug}', summary='Product details')
async def get_product(request: Request, slug: Annotated[str, Path(max_length=180)]) -> ResponseModel:
    product = await catalog_service.get_public_product(slug=slug)
    return response_base.success(request=request, data=GetProductDetail.model_validate(product))


@router.post('/products', summary='Create a product', dependencies=[DependsAdmin])
async def create_product(request: Request, obj: CreateProductParam) -> ResponseModel:
    product = await catalog_service.create_product(obj=obj)
    return response_base.success(request=request, data=GetProductDetail.model_validate(product))


@router.patch('/products/{pk}', summary='Update a product', dependencies=[DependsAdmin])
async def update_product(request: Request, pk: Annotated[int, Path()], obj: UpdateProductParam) -> ResponseModel:
    product = await catalog_service.update_product(pk=pk, obj=obj)
    return response_base.success(request=request, data=GetProductDetail.model_validate(product))


@router.delete('/products/{pk}', summary='Delete a product', dependencies=[DependsAdmin])
async def delete_product(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    await catalog_service.delete_product(pk=pk)
    return response_base.success(request=request)

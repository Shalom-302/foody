"""FOODY back-office: dashboard, orders, full catalogue, uploads."""
import uuid
from datetime import date, datetime
from typing import Annotated

from anyio import to_thread
from fastapi import APIRouter, File, Path, Query, Request, UploadFile

from pydantic import ConfigDict, Field, computed_field

from backend.app.client.schema.catalog import GetCategoryDetail, GetProductDetail
from backend.app.client.schema.order import GetOrderDetail, UpdateOrderStatusParam
from backend.app.client.service.order_service import order_service
from backend.common.enums import OrderStatus
from backend.common.exception import errors
from backend.common.pagination import DependsPagination, paging_data
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.schema import SchemaBase
from backend.crud.crud_user import user_dao
from backend.database.db_postgres import async_db_session
from backend.database.db_redis import redis_client
from backend.common.security.permissions import DependsAdmin
from backend.core.conf import settings
from backend.crud.crud_catalog import category_dao, product_dao
from backend.crud.crud_order import order_dao
from backend.database.db_postgres import CurrentSession

router = APIRouter(prefix='/admin', tags=['Shop admin'], dependencies=[DependsAdmin])

_UPLOAD_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'model/gltf-binary': 'glb',
}


@router.get('/dashboard', summary='Key figures for a period')
async def admin_dashboard(
    request: Request,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> ResponseModel:
    data = await order_service.dashboard(date_from=date_from, date_to=date_to)
    return response_base.success(request=request, data=data)


@router.get('/orders', summary='All orders (paginated)', dependencies=[DependsPagination])
async def admin_list_orders(
    request: Request,
    db: CurrentSession,
    status: Annotated[OrderStatus | None, Query()] = None,
    q: Annotated[str | None, Query(max_length=100, description='Number, phone or name')] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> ResponseModel:
    stmt = order_dao.get_admin_list(
        status=status.value if status else None, q=q, date_from=date_from, date_to=date_to
    )
    data = await paging_data(db, stmt, GetOrderDetail)
    return response_base.success(request=request, data=data)


@router.get('/orders/{pk}', summary='Order details')
async def admin_get_order(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    order = await order_service.get(pk=pk)
    return response_base.success(request=request, data=GetOrderDetail.model_validate(order))


@router.patch('/orders/{pk}/status', summary='Move an order to its next status')
async def admin_update_order_status(
    request: Request, pk: Annotated[int, Path()], obj: UpdateOrderStatusParam
) -> ResponseModel:
    order = await order_service.update_status(pk=pk, obj=obj, admin_id=request.user.id)
    return response_base.success(request=request, data=GetOrderDetail.model_validate(order))


@router.get('/products', summary='Every product, hidden ones included', dependencies=[DependsPagination])
async def admin_list_products(
    request: Request,
    db: CurrentSession,
    category: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    available: Annotated[bool | None, Query()] = None,
) -> ResponseModel:
    stmt = product_dao.get_list(public=False, category=category, q=q, available=available, sort='name')
    data = await paging_data(db, stmt, GetProductDetail)
    return response_base.success(request=request, data=data)


@router.get('/categories', summary='Every category, hidden ones included')
async def admin_list_categories(request: Request, db: CurrentSession) -> ResponseModel:
    rows = (await db.execute(category_dao.get_list(active_only=False))).scalars().all()
    return response_base.success(request=request, data=[GetCategoryDetail.model_validate(c) for c in rows])


class CustomerRole(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    name: str


class CustomerDetail(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pseudo: str | None = None
    full_name: str | None = None
    phone: str | None = None
    status: bool
    join_time: datetime | None = None
    roles: list[CustomerRole] = Field(default_factory=list, exclude=True)

    @computed_field
    @property
    def is_admin(self) -> bool:
        return any(r.name == 'admin' for r in self.roles)


class SetAdminParam(SchemaBase):
    is_admin: bool


@router.get('/customers', summary='Shop customers (paginated)', dependencies=[DependsPagination])
async def admin_list_customers(
    request: Request,
    db: CurrentSession,
    q: Annotated[str | None, Query(max_length=100, description='Pseudo, name or phone')] = None,
    admins: Annotated[bool, Query(description='Admins only')] = False,
) -> ResponseModel:
    page = await paging_data(db, user_dao.get_customer_list(q=q, admins_only=admins), CustomerDetail)
    return response_base.success(request=request, data=page)


@router.patch('/customers/{pk}/admin', summary='Grant or revoke the admin role')
async def admin_set_customer_admin(request: Request, pk: Annotated[int, Path()], obj: SetAdminParam) -> ResponseModel:
    if pk == request.user.id and not obj.is_admin:
        raise errors.ForbiddenError(msg='Vous ne pouvez pas retirer votre propre accès admin.')
    async with async_db_session.begin() as db:
        user = await user_dao.get_with_relation(db, id=pk, populates=['roles'])
        if user is None or not user.phone:
            raise errors.NotFoundError(msg='Client introuvable.')
        await user_dao.set_admin(db, user, obj.is_admin)
        detail = CustomerDetail.model_validate(user)
        x_id = user.x_id
    # The JWT middleware caches roles: drop it so the change applies right away.
    await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{x_id}')
    return response_base.success(request=request, data=detail)


@router.post('/uploads', summary='Upload a product image or a GLB model')
async def admin_upload(request: Request, file: Annotated[UploadFile, File()]) -> ResponseModel:
    ext = _UPLOAD_TYPES.get(file.content_type or '')
    if ext is None and (file.filename or '').lower().endswith('.glb'):
        ext = 'glb'  # browsers often send GLB as application/octet-stream
    if ext is None:
        raise errors.ForbiddenError(msg='Format accepté : JPG, PNG, WEBP, AVIF ou GLB.')
    content = await file.read(settings.UPLOAD_MAX_BYTES + 1)
    if len(content) > settings.UPLOAD_MAX_BYTES:
        raise errors.ForbiddenError(msg='Fichier trop volumineux.')
    from backend.common.cloud_storage import mstorage  # connects to MinIO on import

    folder = 'models' if ext == 'glb' else 'products'
    result = await to_thread.run_sync(mstorage.upload_file, content, f'{folder}/{uuid.uuid4().hex}.{ext}')
    return response_base.success(request=request, data={'url': result['file_url']})

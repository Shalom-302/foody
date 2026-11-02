from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Request
from fastapi_limiter.depends import RateLimiter

from backend.app.client.schema.order import CreateOrderParam, GetOrderDetail
from backend.app.client.service.notify_service import notify_service
from backend.app.client.service.order_service import order_service
from backend.common.pagination import DependsPagination, paging_data
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.security.jwt import DependsJwtAuth
from backend.crud.crud_order import order_dao
from backend.database.db_postgres import CurrentSession

router = APIRouter(prefix='/orders', tags=['Orders'])


@router.get('/delivery-options', summary='Communes, delivery fee and payment methods')
async def delivery_options(request: Request) -> ResponseModel:
    return response_base.success(request=request, data=await order_service.delivery_options())


@router.post(
    '',
    summary='Place an order (prices and stock are checked server-side)',
    dependencies=[DependsJwtAuth, Depends(RateLimiter(times=10, minutes=10))],
)
async def create_order(request: Request, obj: CreateOrderParam, background_tasks: BackgroundTasks) -> ResponseModel:
    order = await order_service.create(user_id=request.user.id, user_phone=request.user.phone, obj=obj)
    background_tasks.add_task(notify_service.new_order, order.id)  # WhatsApp: admins + customer
    return response_base.success(request=request, data=GetOrderDetail.model_validate(order))


@router.get('/me', summary='My orders', dependencies=[DependsJwtAuth, DependsPagination])
async def my_orders(request: Request, db: CurrentSession) -> ResponseModel:
    data = await paging_data(db, order_dao.get_user_list(request.user.id), GetOrderDetail)
    return response_base.success(request=request, data=data)


@router.get('/{pk}', summary='One of my orders', dependencies=[DependsJwtAuth])
async def get_my_order(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    order = await order_service.get_for_user(pk=pk, user_id=request.user.id)
    return response_base.success(request=request, data=GetOrderDetail.model_validate(order))

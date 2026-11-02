"""FOODY back-office, second part: reviews, delivery settings, customer and order deletion."""
from typing import Annotated

from fastapi import APIRouter, Path, Request
from sqlalchemy import asc, select

from backend.app.client.api.v1.shop_admin import CustomerDetail
from backend.app.client.schema.content import (
    DeliverySettingsParam,
    TestimonialBase,
    TestimonialDetail,
    UpdateTestimonialParam,
)
from backend.app.client.service.shop_settings_service import (
    DeliverySettings,
    get_delivery_settings,
    save_delivery_settings,
)
from backend.common.enums import OrderStatus
from backend.common.exception import errors
from backend.common.log import log
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.schema import SchemaBase
from backend.common.security.permissions import DependsAdmin
from backend.core.conf import settings
from backend.crud.crud_user import user_dao
from backend.database.db_postgres import CurrentSession, async_db_session
from backend.database.db_redis import redis_client
from backend.models.order import Order
from backend.models.testimonial import Testimonial

router = APIRouter(prefix='/admin', tags=['Shop admin'], dependencies=[DependsAdmin])


# --- Reviews ---------------------------------------------------------------

@router.get('/testimonials', summary='Every review, hidden ones included')
async def admin_list_testimonials(request: Request, db: CurrentSession) -> ResponseModel:
    rows = (await db.execute(select(Testimonial).order_by(asc(Testimonial.sort_order), asc(Testimonial.id)))).scalars()
    return response_base.success(request=request, data=[TestimonialDetail.model_validate(t) for t in rows])


@router.post('/testimonials', summary='Add a review')
async def admin_create_testimonial(request: Request, obj: TestimonialBase) -> ResponseModel:
    async with async_db_session.begin() as db:
        testimonial = Testimonial(**obj.model_dump())
        db.add(testimonial)
        await db.flush()
        data = TestimonialDetail.model_validate(testimonial)
    return response_base.success(request=request, data=data)


@router.patch('/testimonials/{pk}', summary='Edit a review')
async def admin_update_testimonial(request: Request, pk: Annotated[int, Path()], obj: UpdateTestimonialParam) -> ResponseModel:
    async with async_db_session.begin() as db:
        testimonial = await db.get(Testimonial, pk)
        if testimonial is None:
            raise errors.NotFoundError(msg='Avis introuvable.')
        for key, value in obj.model_dump(exclude_unset=True).items():
            if value is None and key != 'location':
                continue
            setattr(testimonial, key, value)
        await db.flush()
        data = TestimonialDetail.model_validate(testimonial)
    return response_base.success(request=request, data=data)


@router.delete('/testimonials/{pk}', summary='Delete a review')
async def admin_delete_testimonial(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    async with async_db_session.begin() as db:
        testimonial = await db.get(Testimonial, pk)
        if testimonial is None:
            raise errors.NotFoundError(msg='Avis introuvable.')
        await db.delete(testimonial)
    return response_base.success(request=request)


# --- Delivery settings -----------------------------------------------------

@router.get('/settings', summary='Delivery fee, free delivery threshold, pickup address, communes')
async def admin_get_settings(request: Request) -> ResponseModel:
    ds = await get_delivery_settings()
    return response_base.success(request=request, data=DeliverySettingsParam(**ds.__dict__))


@router.put('/settings', summary='Save the delivery settings')
async def admin_save_settings(request: Request, obj: DeliverySettingsParam) -> ResponseModel:
    await save_delivery_settings(DeliverySettings(**obj.model_dump()))
    log.info(f'delivery settings changed by admin {request.user.id}: fee {obj.delivery_fee} FCFA, '
             f'{len(obj.communes)} communes')
    return response_base.success(request=request, data=obj)


# --- Customers -------------------------------------------------------------

class SetStatusParam(SchemaBase):
    status: bool  # False = blocked: cannot log in nor order


async def _end_sessions(x_id: str) -> None:
    for prefix in (settings.TOKEN_REDIS_PREFIX, settings.TOKEN_REFRESH_REDIS_PREFIX):
        await redis_client.delete_prefix(f'{prefix}:{x_id}:')
    await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{x_id}')


@router.patch('/customers/{pk}/status', summary='Block or unblock a customer')
async def admin_set_customer_status(request: Request, pk: Annotated[int, Path()], obj: SetStatusParam) -> ResponseModel:
    if pk == request.user.id:
        raise errors.ForbiddenError(msg='Vous ne pouvez pas bloquer votre propre compte.')
    async with async_db_session.begin() as db:
        user = await user_dao.get_with_relation(db, id=pk, populates=['roles'])
        if user is None or not user.phone:
            raise errors.NotFoundError(msg='Client introuvable.')
        user.status = obj.status
        x_id = user.x_id
        await db.flush()
        detail = CustomerDetail.model_validate(user)
    if not obj.status:
        await _end_sessions(x_id)  # blocked: logged out everywhere, right now
    else:
        await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{x_id}')
    return response_base.success(request=request, data=detail)


@router.delete('/customers/{pk}', summary='Delete a customer account (orders are kept)')
async def admin_delete_customer(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    if pk == request.user.id:
        raise errors.ForbiddenError(msg='Vous ne pouvez pas supprimer votre propre compte.')
    async with async_db_session.begin() as db:
        user = await user_dao.get_with_relation(db, id=pk, populates=['roles'])
        if user is None or not user.phone:
            raise errors.NotFoundError(msg='Client introuvable.')
        x_id = user.x_id
        # Orders keep their pseudo / name / phone snapshot (user_id -> NULL).
        await db.delete(user)
    await _end_sessions(x_id)
    log.info(f'customer {pk} deleted by admin {request.user.id}')
    return response_base.success(request=request)


# --- Orders ----------------------------------------------------------------

@router.delete('/orders/{pk}', summary='Delete a cancelled order')
async def admin_delete_order(request: Request, pk: Annotated[int, Path()]) -> ResponseModel:
    async with async_db_session.begin() as db:
        order = await db.get(Order, pk)
        if order is None:
            raise errors.NotFoundError(msg='Commande introuvable.')
        if order.status != OrderStatus.CANCELLED.value:
            # Sales history stays complete: only cancelled orders can go.
            raise errors.ForbiddenError(msg="Seule une commande annulée peut être supprimée. Annulez-la d'abord.")
        number = order.order_number
        await db.delete(order)
    log.info(f'order {number} deleted by admin {request.user.id}')
    return response_base.success(request=request)

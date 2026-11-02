import secrets
from datetime import date

from sqlalchemy import func, select

from backend.app.client.schema.order import CreateOrderParam, UpdateOrderStatusParam
from backend.common.enums import (
    ORDER_STATUS_TRANSITIONS,
    DeliveryMethod,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
)
from backend.common.exception import errors
from backend.common.log import log
from backend.core.conf import settings
from backend.crud.crud_catalog import product_dao
from backend.crud.crud_order import day_bounds, order_dao
from backend.app.client.service.shop_settings_service import DeliverySettings, get_delivery_settings
from backend.crud.crud_user import user_dao
from backend.database.db_postgres import async_db_session
from backend.models.order import Order, OrderItem
from backend.models.product import Product
from backend.utils.timezone import timezone

_ORDER_NUMBER_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'  # no 0/O, 1/I


def delivery_fee_for(method: DeliveryMethod, subtotal: int, ds: DeliverySettings) -> int:
    if method == DeliveryMethod.PICKUP:
        return 0
    if ds.free_delivery_threshold and subtotal >= ds.free_delivery_threshold:
        return 0
    return ds.delivery_fee


class OrderService:
    @staticmethod
    async def delivery_options() -> dict:
        ds = await get_delivery_settings()
        return {
            'delivery_fee': ds.delivery_fee,
            'free_delivery_threshold': ds.free_delivery_threshold,
            'communes': ds.communes,
            'pickup_address': ds.pickup_address,
            'payment_methods': settings.PAYMENT_METHODS_ENABLED,
        }

    @staticmethod
    async def _new_number(db) -> str:
        day = timezone.now().strftime('%y%m%d')
        for _ in range(10):
            number = f'FD{day}-' + ''.join(secrets.choice(_ORDER_NUMBER_ALPHABET) for _ in range(4))
            if not await order_dao.number_exists(db, number):
                return number
        raise errors.ServerError(msg='Impossible de générer un numéro de commande.')

    @staticmethod
    async def create(*, user_id: int, user_phone: str | None, obj: CreateOrderParam) -> Order:
        # SchemaBase uses use_enum_values: enum fields arrive as plain strings.
        delivery_method = DeliveryMethod(obj.delivery_method)
        payment_method = PaymentMethod(obj.payment_method)
        if payment_method.value not in settings.PAYMENT_METHODS_ENABLED:
            raise errors.ForbiddenError(msg="Ce moyen de paiement n'est pas encore disponible.")
        phone = obj.customer_phone or user_phone
        if not phone:
            raise errors.ForbiddenError(msg='Le numéro WhatsApp est obligatoire.')

        # Merge duplicate lines; prices and stock are read from the database only.
        quantities: dict[int, int] = {}
        for item in obj.items:
            quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

        async with async_db_session.begin() as db:
            user = await user_dao.get(db, user_id)
            if user is None or not user.pseudo:
                raise errors.ForbiddenError(msg='Choisissez un pseudo avant de commander.')
            ds = await get_delivery_settings(db)
            if delivery_method == DeliveryMethod.DELIVERY and obj.delivery_commune not in ds.communes:
                raise errors.ForbiddenError(msg="Nous ne livrons pas encore cette commune.")
            products = await product_dao.lock_many(db, list(quantities))
            lines: list[OrderItem] = []
            for product_id, quantity in quantities.items():
                product = products.get(product_id)
                if product is None or not product.is_active or not product.category.is_active:
                    raise errors.ForbiddenError(msg="Un produit de votre panier n'est plus proposé.")
                if quantity > settings.ORDER_MAX_QUANTITY_PER_ITEM:
                    raise errors.ForbiddenError(msg=f'Quantité trop élevée pour « {product.name} ».')
                if product.stock < quantity:
                    raise errors.ForbiddenError(
                        msg=f'Stock insuffisant pour « {product.name} » ({product.stock} disponible(s)).',
                        data={'product_id': product.id, 'available': product.stock},
                    )
                product.stock -= quantity
                lines.append(OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    quantity=quantity,
                    unit_price=product.price,
                    subtotal=product.price * quantity,
                ))

            subtotal = sum(line.subtotal for line in lines)
            delivery_fee = delivery_fee_for(delivery_method, subtotal, ds)
            is_delivery = delivery_method == DeliveryMethod.DELIVERY
            order = Order(
                user_id=user_id,
                order_number=await OrderService._new_number(db),
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total=subtotal + delivery_fee,
                customer_name=obj.customer_name.strip(),
                customer_phone=phone,
                delivery_method=delivery_method.value,
                payment_method=payment_method.value,
                customer_pseudo=user.pseudo,
                delivery_address=obj.delivery_address.strip() if is_delivery and obj.delivery_address else None,
                delivery_commune=obj.delivery_commune if is_delivery else None,
                delivery_instructions=obj.delivery_instructions,
                notes=obj.notes,
            )
            order.items.extend(lines)
            db.add(order)

            # The first order fills in the customer's name on the profile.
            if not user.full_name:
                user.full_name = order.customer_name

            await db.flush()
            await db.refresh(order)
            log.info(f'order {order.order_number} created: {order.total} FCFA, user {user_id}')
            return order

    @staticmethod
    async def get_for_user(*, pk: int, user_id: int) -> Order:
        async with async_db_session() as db:
            order = await order_dao.select_model(db, pk)
        # Same 404 for "not yours": order ids are sequential.
        if not order or order.user_id != user_id:
            raise errors.NotFoundError(msg='Commande introuvable.')
        return order

    @staticmethod
    async def get(*, pk: int) -> Order:
        async with async_db_session() as db:
            order = await order_dao.select_model(db, pk)
        if not order:
            raise errors.NotFoundError(msg='Commande introuvable.')
        return order

    @staticmethod
    async def update_status(*, pk: int, obj: UpdateOrderStatusParam, admin_id: int) -> Order:
        async with async_db_session.begin() as db:
            order = await order_dao.get_for_update(db, pk)
            if not order:
                raise errors.NotFoundError(msg='Commande introuvable.')
            current = OrderStatus(order.status)
            new_status = OrderStatus(obj.status)
            payment_status = PaymentStatus(obj.payment_status) if obj.payment_status else None
            if new_status != current:
                if new_status not in ORDER_STATUS_TRANSITIONS[current]:
                    raise errors.ForbiddenError(
                        msg=f'Transition impossible : {current.value} → {new_status.value}.')
                if new_status == OrderStatus.CANCELLED:
                    # Give the stock back.
                    products = await product_dao.lock_many(
                        db, [i.product_id for i in order.items if i.product_id is not None])
                    for item in order.items:
                        if item.product_id in products:
                            products[item.product_id].stock += item.quantity
                if (new_status == OrderStatus.DELIVERED and order.payment_method == PaymentMethod.CASH.value
                        and payment_status is None):
                    order.payment_status = PaymentStatus.PAID.value  # cash collected on delivery
                order.status = new_status.value
            if payment_status is not None:
                order.payment_status = payment_status.value
            await db.flush()
            await db.refresh(order)
            log.info(f'order {order.order_number}: {current.value} -> {order.status} '
                     f'(payment {order.payment_status}) by admin {admin_id}')
            return order

    @staticmethod
    async def dashboard(*, date_from: date | None = None, date_to: date | None = None) -> dict:
        start, end = day_bounds(date_from, date_to)

        def in_period(stmt):
            if start:
                stmt = stmt.where(Order.created_time >= start)
            if end:
                stmt = stmt.where(Order.created_time < end)
            return stmt

        not_cancelled = Order.status != OrderStatus.CANCELLED.value
        async with async_db_session() as db:
            orders_count = await db.scalar(in_period(select(func.count(Order.id))))
            revenue = await db.scalar(
                in_period(select(func.coalesce(func.sum(Order.total), 0)).where(not_cancelled)))
            pending = await db.scalar(
                in_period(select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING.value)))
            available_products = await db.scalar(
                select(func.count(Product.id)).where(Product.is_active.is_(True), Product.stock > 0))
            sold = func.sum(OrderItem.quantity).label('quantity')
            top_stmt = in_period(
                select(OrderItem.product_id, OrderItem.product_name, sold,
                       func.sum(OrderItem.subtotal).label('revenue'))
                .join(Order, Order.id == OrderItem.order_id)
                .where(not_cancelled)
                .group_by(OrderItem.product_id, OrderItem.product_name)
                .order_by(sold.desc())
                .limit(5)
            )
            top = (await db.execute(top_stmt)).all()
        return {
            'orders_count': orders_count or 0,
            'revenue': int(revenue or 0),
            'pending_orders': pending or 0,
            'available_products': available_products or 0,
            'top_products': [
                {'product_id': r.product_id, 'name': r.product_name, 'quantity': int(r.quantity),
                 'revenue': int(r.revenue)}
                for r in top
            ],
        }


order_service: OrderService = OrderService()

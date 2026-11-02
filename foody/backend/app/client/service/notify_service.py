"""WhatsApp notifications for orders (through gowa, like the login codes).

- every admin, plus ORDER_NOTIFY_PHONES, gets each new order with its details
  and a link to it in the back-office;
- the customer gets an acknowledgement, then a message at the steps that
  matter to them (confirmed, on its way / ready for pickup, delivered, cancelled).

Always run as a background task: a WhatsApp hiccup must never fail an order.
"""
import asyncio

from sqlalchemy import select

from backend.app.client.service.otp_service import send_whatsapp_text
from backend.common.enums import DeliveryMethod, OrderStatus, PaymentMethod
from backend.common.log import log
from backend.core.conf import settings
from backend.database.db_postgres import async_db_session
from backend.models.order import Order
from backend.models.role import Role
from backend.models.user import User
from backend.utils.phone import normalize_phone

_fcfa = lambda n: f"{n:,}".replace(",", " ") + " FCFA"  # noqa: E731  12 500 FCFA


def _display_phone(phone: str) -> str:
    if phone.startswith('225') and len(phone) == 13:
        local = phone[3:]
        return '+225 ' + ' '.join(local[i:i + 2] for i in range(0, 10, 2))
    return f'+{phone}'


async def _admin_phones() -> list[str]:
    phones: list[str] = []
    async with async_db_session() as db:
        stmt = (
            select(User.phone)
            .join(User.roles)
            .where(Role.name == 'admin', User.phone.is_not(None), User.status.is_(True))
        )
        phones.extend(p for p in (await db.execute(stmt)).scalars() if p)
    for raw in settings.ORDER_NOTIFY_PHONES:
        try:
            phones.append(normalize_phone(raw))
        except ValueError:
            log.warning(f'ORDER_NOTIFY_PHONES: ignoring invalid number {raw!r}')
    return list(dict.fromkeys(phones))  # unique, order kept


async def _load(order_id: int) -> Order | None:
    async with async_db_session() as db:
        return await db.get(Order, order_id)


async def _send(phone: str, message: str) -> None:
    try:
        await send_whatsapp_text(phone, message)
    except Exception as exc:  # noqa: BLE001 - logged, never raised to the customer
        log.error(f'order notification to {phone} failed: {getattr(exc, "msg", exc)}')


def _admin_message(order: Order) -> str:
    who = order.customer_pseudo or order.customer_name
    lines = [
        f'🛍️ Nouvelle commande {order.order_number}',
        '',
        f'👤 {who}' + (f' ({order.customer_name})' if order.customer_pseudo and order.customer_name != order.customer_pseudo else ''),
        f'📞 {_display_phone(order.customer_phone)}',
    ]
    if order.delivery_method == DeliveryMethod.DELIVERY.value:
        lines.append(f'🛵 Livraison : {order.delivery_commune} — {order.delivery_address}')
    else:
        lines.append('🏠 Retrait sur place')
    if order.delivery_instructions:
        lines.append(f'📝 {order.delivery_instructions}')
    lines += ['', *[f'• {i.quantity}× {i.product_name} — {_fcfa(i.subtotal)}' for i in order.items], '']
    lines.append(f'Sous-total : {_fcfa(order.subtotal)}')
    lines.append(f'Livraison : {_fcfa(order.delivery_fee) if order.delivery_fee else "offerte"}')
    lines.append(f'💰 Total : {_fcfa(order.total)}')
    payment = 'à la livraison' if order.payment_method == PaymentMethod.CASH.value else 'Mobile Money'
    lines.append(f'Paiement : {payment}')
    if settings.SITE_URL:
        lines += ['', f'Gérer la commande : {settings.SITE_URL.rstrip("/")}/admin/commandes/{order.id}']
    return '\n'.join(lines)


def _customer_ack(order: Order) -> str:
    who = order.customer_pseudo or order.customer_name
    text = (
        f'Merci {who} ! 🌼 {settings.BRAND_NAME} a bien reçu votre commande {order.order_number} '
        f'({_fcfa(order.total)}). Nous revenons vers vous très vite pour la confirmer.'
    )
    if settings.SITE_URL:
        text += f'\nSuivre la commande : {settings.SITE_URL.rstrip("/")}/mon-compte/commandes/{order.id}'
    return text


def _customer_status(order: Order) -> str | None:
    n = order.order_number
    pickup = order.delivery_method == DeliveryMethod.PICKUP.value
    return {
        OrderStatus.CONFIRMED.value: f'✅ Votre commande {n} est confirmée, nous la préparons avec soin.',
        OrderStatus.READY.value: f'🎉 Votre commande {n} est prête, vous pouvez venir la récupérer.' if pickup else None,
        OrderStatus.OUT_FOR_DELIVERY.value: f'🛵 Votre commande {n} est en route ! Gardez votre téléphone à portée de main.',
        OrderStatus.DELIVERED.value: f'💛 Commande {n} livrée. Merci et bonne dégustation !',
        OrderStatus.CANCELLED.value: f'Votre commande {n} a été annulée. Une question ? Répondez simplement à ce message.',
    }.get(order.status)


class NotifyService:
    @staticmethod
    async def new_order(order_id: int) -> None:
        order = await _load(order_id)
        if order is None:
            return
        if settings.ORDER_NOTIFY_ADMINS:
            message = _admin_message(order)
            for phone in await _admin_phones():
                await _send(phone, message)
                await asyncio.sleep(1)  # never burst: gowa numbers get banned for spam
        if settings.ORDER_NOTIFY_CUSTOMER:
            await _send(order.customer_phone, _customer_ack(order))

    @staticmethod
    async def customer_changed(order_id: int, cancelled: bool) -> None:
        """The customer modified or cancelled a pending order: tell the admins."""
        if not settings.ORDER_NOTIFY_ADMINS:
            return
        order = await _load(order_id)
        if order is None:
            return
        who = order.customer_pseudo or order.customer_name
        if cancelled:
            message = f'❌ Commande {order.order_number} annulée par le client ({who}). Le stock a été remis.'
        else:
            message = '✏️ Commande modifiée par le client\n\n' + _admin_message(order).replace(
                f'🛍️ Nouvelle commande {order.order_number}', f'Commande {order.order_number}', 1)
        for phone in await _admin_phones():
            await _send(phone, message)
            await asyncio.sleep(1)

    @staticmethod
    async def status_changed(order_id: int) -> None:
        if not settings.ORDER_NOTIFY_CUSTOMER:
            return
        order = await _load(order_id)
        message = _customer_status(order) if order else None
        if message:
            await _send(order.customer_phone, message)


notify_service: NotifyService = NotifyService()

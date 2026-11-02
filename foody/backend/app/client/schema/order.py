from datetime import datetime

from pydantic import ConfigDict, Field, field_validator, model_validator
from typing_extensions import Self

from backend.common.enums import DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus
from backend.common.schema import SchemaBase
from backend.core.conf import settings
from backend.utils.phone import normalize_phone


class OrderItemParam(SchemaBase):
    product_id: int
    quantity: int = Field(ge=1, le=settings.ORDER_MAX_QUANTITY_PER_ITEM)


class CreateOrderParam(SchemaBase):
    """What the customer sends. No price here: amounts are computed server-side."""

    items: list[OrderItemParam] = Field(min_length=1, max_length=50)
    customer_name: str = Field(min_length=2, max_length=120)
    # Defaults to the account's WhatsApp number.
    customer_phone: str | None = Field(default=None, max_length=25)
    delivery_method: DeliveryMethod
    delivery_address: str | None = Field(default=None, max_length=300)
    delivery_commune: str | None = Field(default=None, max_length=60)
    delivery_instructions: str | None = Field(default=None, max_length=500)
    payment_method: PaymentMethod = PaymentMethod.CASH
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator('customer_phone')
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return normalize_phone(v) if v else None

    @model_validator(mode='after')
    def _delivery_fields(self) -> Self:
        if self.delivery_method == DeliveryMethod.DELIVERY:
            if not (self.delivery_address and self.delivery_address.strip()):
                raise ValueError("L'adresse de livraison est obligatoire.")
            # The commune is checked against the admin settings in order_service.
            if not self.delivery_commune:
                raise ValueError('La commune de livraison est obligatoire.')
        return self


class UpdateOrderStatusParam(SchemaBase):
    status: OrderStatus
    payment_status: PaymentStatus | None = None


class GetOrderItemDetail(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None = None
    product_name: str
    quantity: int
    unit_price: int
    subtotal: int


class GetOrderDetail(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: int | None = None
    status: OrderStatus
    subtotal: int
    delivery_fee: int
    total: int
    customer_name: str
    customer_phone: str
    customer_pseudo: str | None = None
    delivery_method: DeliveryMethod
    delivery_address: str | None = None
    delivery_commune: str | None = None
    delivery_instructions: str | None = None
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    notes: str | None = None
    items: list[GetOrderItemDetail] = []
    created_time: datetime
    updated_time: datetime | None = None

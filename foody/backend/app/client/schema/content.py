from pydantic import ConfigDict, Field, field_validator

from backend.common.schema import SchemaBase


class TestimonialBase(SchemaBase):
    author: str = Field(min_length=2, max_length=80)
    quote: str = Field(min_length=5, max_length=400)
    location: str | None = Field(default=None, max_length=80)
    is_active: bool = True
    sort_order: int = 0


class UpdateTestimonialParam(SchemaBase):
    author: str | None = Field(default=None, min_length=2, max_length=80)
    quote: str | None = Field(default=None, min_length=5, max_length=400)
    location: str | None = Field(default=None, max_length=80)
    is_active: bool | None = None
    sort_order: int | None = None


class TestimonialDetail(TestimonialBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DeliverySettingsParam(SchemaBase):
    delivery_fee: int = Field(ge=0, le=100_000, description='FCFA')
    free_delivery_threshold: int = Field(default=0, ge=0, le=10_000_000, description='0 = never free')
    pickup_address: str | None = Field(default=None, max_length=300)
    communes: list[str] = Field(min_length=1, max_length=100)

    @field_validator('communes')
    @classmethod
    def _communes(cls, v: list[str]) -> list[str]:
        seen: list[str] = []
        for name in (' '.join(c.split()) for c in v):
            if not name or len(name) > 60:
                raise ValueError('Nom de commune invalide (1 à 60 caractères).')
            if name.lower() not in (s.lower() for s in seen):
                seen.append(name)
        return seen

    @field_validator('pickup_address')
    @classmethod
    def _pickup(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None

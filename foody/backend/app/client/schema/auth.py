from pydantic import Field, field_validator

from backend.common.schema import SchemaBase
from backend.utils.phone import normalize_phone


class RequestOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25, description='Numéro WhatsApp')

    _norm = field_validator('phone')(normalize_phone)


class VerifyOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25)
    code: str = Field(min_length=4, max_length=8, pattern=r'^\s*\d+\s*$')
    # Only used to name a brand-new account.
    full_name: str | None = Field(default=None, max_length=120)

    _norm = field_validator('phone')(normalize_phone)


class UpdateProfileParam(SchemaBase):
    full_name: str = Field(min_length=2, max_length=120)

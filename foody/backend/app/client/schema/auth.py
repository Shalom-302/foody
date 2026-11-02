import re

from pydantic import Field, field_validator

from backend.common.schema import SchemaBase
from backend.utils.phone import normalize_phone

# 3-30 characters: letters (accents included), digits, and . _ - or single
# spaces inside. Must start and end with a letter or a digit.
_PSEUDO_RE = re.compile(r"^[0-9A-Za-zÀ-ÖØ-öø-ÿ](?:[0-9A-Za-zÀ-ÖØ-öø-ÿ._\- ]{1,28})[0-9A-Za-zÀ-ÖØ-öø-ÿ]$")
# A customer must not pass for the shop on an order.
_RESERVED = ('admin', 'foody', 'miniardise', 'support', 'moderat')


def normalize_pseudo(value: str) -> str:
    pseudo = ' '.join(value.split())
    if not _PSEUDO_RE.match(pseudo):
        raise ValueError(
            'Pseudo invalide : 3 à 30 caractères, lettres, chiffres, espaces, « . », « _ » ou « - ».')
    if any(word in pseudo.lower() for word in _RESERVED):
        raise ValueError('Ce pseudo est réservé, choisissez-en un autre.')
    return pseudo


class RequestOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25, description='Numéro WhatsApp')

    _norm = field_validator('phone')(normalize_phone)


class VerifyOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25)
    code: str = Field(min_length=4, max_length=8, pattern=r'^\s*\d+\s*$')

    _norm = field_validator('phone')(normalize_phone)


class UpdateProfileParam(SchemaBase):
    pseudo: str | None = Field(default=None, max_length=40)
    full_name: str | None = Field(default=None, min_length=2, max_length=120)

    @field_validator('pseudo')
    @classmethod
    def _pseudo(cls, v: str | None) -> str | None:
        return normalize_pseudo(v) if v is not None else None

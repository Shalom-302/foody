from backend.core.conf import settings


def normalize_phone(value: str) -> str:
    """Bring a typed phone number to the stored form: digits, country code first.

    Ported from SignalLab. ``+225 07 88 01 62 04``, ``00225...`` and a local
    ``07 88 01 62 04`` all become ``2250788016204``.
    """
    raw = value.strip()
    digits = ''.join(ch for ch in raw if ch.isdigit())
    if not raw.startswith('+') and digits.startswith('00'):
        digits = digits[2:]
    # Local number typed without the country code. Ivorian numbers keep their
    # leading 0 since the 2021 switch to 10 digits.
    elif not raw.startswith('+') and digits.startswith('0'):
        digits = settings.PHONE_DEFAULT_COUNTRY_CODE + digits
    if not (8 <= len(digits) <= 15):
        raise ValueError('Numéro de téléphone invalide (indicatif + numéro, chiffres uniquement).')
    return digits

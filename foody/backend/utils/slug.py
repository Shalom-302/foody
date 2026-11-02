import re
import unicodedata


def slugify(value: str) -> str:
    """``Jus de Bissap glacé`` -> ``jus-de-bissap-glace``."""
    ascii_value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', ascii_value.lower()).strip('-')

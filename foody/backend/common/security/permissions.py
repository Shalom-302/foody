from fastapi import Depends, Request

from backend.common.enums import Role
from backend.common.exception.errors import AuthorizationError, TokenError
from backend.common.security.jwt import DependsJwtAuth


async def admin_verify(request: Request, _token: str = DependsJwtAuth) -> None:
    """Shop back-office guard: an authenticated user holding the ``admin`` role."""
    if not request.auth.scopes:
        raise TokenError
    roles = request.user.roles or []
    if not any(getattr(role, 'name', role) == Role.ADMIN.value and getattr(role, 'status', 1) for role in roles):
        raise AuthorizationError(msg='Accès réservé à l’administration FOODY.')


DependsAdmin = Depends(admin_verify)

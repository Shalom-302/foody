"""Passwordless shop login: WhatsApp number + one-time code.

``request_otp`` answers the same way whether the number has an account or not
(the account is created on the first verified code), so the form cannot be
used to find out who is a customer.
"""
from datetime import datetime

from fastapi import Request, Response
from starlette.background import BackgroundTasks

from backend.app.admin.schema.token import GetLoginToken
from backend.app.admin.service.login_log_service import LoginLogService
from backend.app.client.schema.auth import RequestOtpParam, UpdateProfileParam, VerifyOtpParam
from backend.app.client.service.otp_service import otp_service
from backend.common.enums import LoginLogStatusType
from backend.common.exception import errors
from backend.common.security.jwt import create_access_token, create_refresh_token
from backend.core.conf import settings
from backend.crud.crud_user import user_dao
from backend.database.db_postgres import async_db_session
from backend.database.db_redis import redis_client
from backend.utils.timezone import timezone


def _set_refresh_cookie(response: Response, refresh_token: str, expire_time) -> None:
    response.set_cookie(
        key=settings.COOKIE_REFRESH_TOKEN_KEY,
        value=refresh_token,
        max_age=settings.COOKIE_REFRESH_TOKEN_EXPIRE_SECONDS,
        expires=timezone.f_utc(expire_time),
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE or settings.ENVIRONMENT != 'dev',
    )


async def _log_login(request: Request, user_x_id: str, phone: str) -> None:
    async with async_db_session() as db:
        await LoginLogService.create(
            db=db,
            request=request,
            user_x_id=user_x_id,
            email=phone,
            login_time=datetime.now(),
            status=LoginLogStatusType.success.value,
            msg='WhatsApp OTP login',
        )


class WhatsappAuthService:
    @staticmethod
    async def request_otp(*, obj: RequestOtpParam) -> dict:
        if not await otp_service.can_resend(obj.phone):
            raise errors.ForbiddenError(msg='Patientez un instant avant de redemander un code.')
        await otp_service.start(obj.phone)
        await otp_service.mark_resent(obj.phone)
        return {
            'sent': True,
            'phone': obj.phone,
            'expires_in': settings.OTP_TTL_SECONDS,
            'resend_in': settings.OTP_RESEND_COOLDOWN_SECONDS,
        }

    @staticmethod
    async def verify_otp(
        *, request: Request, response: Response, obj: VerifyOtpParam, background_tasks: BackgroundTasks
    ) -> dict:
        await otp_service.verify(obj.phone, obj.code)  # raises on bad/expired code
        full_name = obj.full_name.strip() if obj.full_name else None
        async with async_db_session.begin() as db:
            user = await user_dao.get_by_phone(db, obj.phone)
            is_new = user is None
            if is_new:
                user = await user_dao.add_whatsapp_customer(db, obj.phone, full_name)
            elif not user.status:
                raise errors.AuthorizationError(msg='Ce compte a été désactivé. Contactez FOODY.')
            elif full_name and not user.full_name:
                user.full_name = full_name
            user.last_login_time = timezone.now()
            x_id = user.x_id
            access_token = await create_access_token(str(x_id), False)
            refresh_token = await create_refresh_token(str(x_id), False)
            n_user = await user_dao.get_with_relation(db, x_id=x_id, populates=['roles'])
            data = GetLoginToken(
                access_token=access_token.access_token,
                access_token_expire_time=access_token.access_token_expire_time,
                user=n_user,  # type: ignore
            )
        # Profile may have changed: drop the JWT middleware's cached copy.
        await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{x_id}')
        background_tasks.add_task(_log_login, request, x_id, obj.phone)
        _set_refresh_cookie(response, refresh_token.refresh_token, refresh_token.refresh_token_expire_time)
        return {**data.model_dump(), 'is_new_user': is_new}

    @staticmethod
    async def update_profile(*, request: Request, obj: UpdateProfileParam) -> None:
        async with async_db_session.begin() as db:
            await user_dao.update_model(db, request.user.id, {'full_name': obj.full_name.strip()})
        await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{request.user.x_id}')


whatsapp_auth_service: WhatsappAuthService = WhatsappAuthService()

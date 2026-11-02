"""Shop authentication: WhatsApp number + one-time code, no password."""
from fastapi import APIRouter, Depends, Request, Response
from fastapi_limiter.depends import RateLimiter
from starlette.background import BackgroundTasks

from backend.app.admin.schema.user import GetCurrentUserInfoDetail
from backend.app.admin.service.auth_service import auth_service
from backend.app.client.schema.auth import RequestOtpParam, UpdateProfileParam, VerifyOtpParam
from backend.app.client.service.whatsapp_auth_service import whatsapp_auth_service
from backend.common.response.response_schema import ResponseModel, response_base
from backend.common.security.jwt import DependsJwtAuth

router = APIRouter(prefix='/auth', tags=['Auth'])


@router.post(
    '/whatsapp/request-otp',
    summary='Send a login code on WhatsApp',
    # Per-IP guard kept loose (CI mobile carriers share IPs); the real anti-spam
    # limit is per phone number in otp_service.
    dependencies=[Depends(RateLimiter(times=10, minutes=10))],
)
async def request_otp(request: Request, obj: RequestOtpParam) -> ResponseModel:
    data = await whatsapp_auth_service.request_otp(obj=obj)
    return response_base.success(request=request, data=data)


@router.post(
    '/whatsapp/verify-otp',
    summary='Verify the code: logs in, creating the account on first use',
    dependencies=[Depends(RateLimiter(times=10, minutes=10))],
)
async def verify_otp(
    request: Request, response: Response, obj: VerifyOtpParam, background_tasks: BackgroundTasks
) -> ResponseModel:
    data = await whatsapp_auth_service.verify_otp(
        request=request, response=response, obj=obj, background_tasks=background_tasks
    )
    return response_base.success(request=request, data=data)


@router.post('/refresh', summary='Exchange the refresh cookie for a new access token')
async def customer_refresh(request: Request, response: Response) -> ResponseModel:
    data = await auth_service.new_token(request=request, response=response)
    return response_base.success(request=request, data=data)


@router.get('/me', summary='Current customer', dependencies=[DependsJwtAuth])
async def customer_me(request: Request) -> ResponseModel:
    data = GetCurrentUserInfoDetail(**request.user.model_dump())
    return response_base.success(request=request, data=data)


@router.patch('/me', summary='Update my profile', dependencies=[DependsJwtAuth])
async def update_me(request: Request, obj: UpdateProfileParam) -> ResponseModel:
    await whatsapp_auth_service.update_profile(request=request, obj=obj)
    return response_base.success(request=request)


@router.post('/logout', summary='Log out', dependencies=[DependsJwtAuth])
async def customer_logout(request: Request, response: Response) -> ResponseModel:
    await auth_service.logout(request=request, response=response)
    return response_base.success(request=request)

from functools import lru_cache
import os
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from backend.core.path_conf import ApiV2Path


class Settings(BaseSettings):
    """Global settings.

    Every field has a sane development default so the app boots out of the box
    (e.g. ``docker-run.sh up`` with the bundled docker-compose). Override via the
    ``.env`` file for your own setup, and ALWAYS set real secrets in production.
    """

    model_config = SettingsConfigDict(
        env_file=f'{ApiV2Path}/.env', env_file_encoding='utf-8', extra='ignore'
    )

    APP_NAME: str = 'foody'

    # Env Config
    ENVIRONMENT: Literal['dev', 'preprod', 'prod'] = 'dev'

    # Database schema bootstrap: in dev, tables are auto-created on startup for a
    # zero-friction first run. In production set DB_AUTO_CREATE=false and rely on
    # Alembic migrations (`shaapi db generate` / `shaapi db apply`).
    DB_AUTO_CREATE: bool = True

    # Observability (opt-in). When disabled, the OpenTelemetry/Prometheus stack
    # is never imported, keeping the lean core lightweight.
    OBSERVABILITY_ENABLED: bool = False
    OTLP_GRPC_ENDPOINT: str | None = None

    # Postgres
    POSTGRES_HOST: str = 'localhost'
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = 'postgres'
    POSTGRES_PASSWORD: str = 'postgres'
    POSTGRES_ECHO: bool = False
    POSTGRES_DATABASE: str = 'foody'

    CLIENT_URL: str = 'http://localhost:3000'

    # Redis
    REDIS_HOST: str = 'localhost'
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None
    REDIS_DATABASE: int = 0
    REDIS_TIMEOUT: int = 5

    # Object storage (MinIO / S3-compatible)
    MINIO_ENDPOINT: str = 'localhost:9000'
    MINIO_PORT: int = 9000
    MINIO_ACCESS_KEY: str = 'minioadmin'
    MINIO_SECRET_KEY: str = 'minioadmin'
    MINIO_BUCKET_NAME: str = 'foody'
    MINIO_CLOUD_URL: str = 'http://localhost:9000'

    # SMTP / email (optional: leave blank to disable outgoing mail)
    SMTP_TLS: str = 'True'
    SMTP_PORT: str = '587'
    SMTP_HOST: str = ''
    SMTP_USER: str = ''
    EMAILS_FROM_EMAIL: str = ''
    EMAILS_FROM_NAME: str = ''
    SMTP_PASSWORD: str = ''
    EMAIL_TEMPLATES_DIR: str = os.getcwd() + '/templates/build'

    # Token / crypto secrets — CHANGE THESE IN PRODUCTION
    # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
    TOKEN_SECRET_KEY: str = 'dev-insecure-change-me-token-secret-key'
    # Generate with: python -c "import os; print(os.urandom(32).hex())"
    OPERA_LOG_ENCRYPT_SECRET_KEY: str = 'dev-insecure-change-me-opera-log-key'

    # Google SSO (optional)
    GOOGLE_CLIENT_ID: str = ''
    GOOGLE_SECRET_KEY: str = ''
    GOOGLE_WEBHOOK_OAUTH_REDIRECT_URI: str = ''

    # FastAPI
    FASTAPI_API_V1_PATH: str = '/api/v1'
    FASTAPI_TITLE: str = 'foody'
    FASTAPI_VERSION: str = '0.0.1'
    FASTAPI_DESCRIPTION: str = 'A lean, batteries-included FastAPI backend.'
    FASTAPI_DOCS_URL: str | None = f'{FASTAPI_API_V1_PATH}/docs'
    FASTAPI_REDOCS_URL: str | None = f'{FASTAPI_API_V1_PATH}/redocs'
    FASTAPI_OPENAPI_URL: str | None = f'{FASTAPI_API_V1_PATH}/openapi'
    FASTAPI_STATIC_FILES: bool = False

    # Token
    TOKEN_ALGORITHM: str = 'HS256'
    TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 1  # access token lifetime (renewed silently)
    # Refresh token lifetime. Sliding: every refresh issues a new one, so a
    # customer who comes back at least once in this window never logs out.
    TOKEN_REFRESH_EXPIRE_SECONDS: int = 60 * 60 * 24 * 90
    # One session per device: logging in on the laptop keeps the phone logged in.
    TOKEN_MULTI_LOGIN: bool = True
    TOKEN_REDIS_PREFIX: str = 'foody:token'
    USER_SECURE_TOKEN_REDIS_PREFIX: str = 'foody:user:token'
    ADMIN_SECURE_TOKEN_REDIS_PREFIX: str = 'foody:admin:token'
    TOKEN_REFRESH_REDIS_PREFIX: str = 'foody:refresh_token'
    CAPTCHA_LOGIN_REDIS_PREFIX: str = 'foody:captcha:login'
    TOKEN_REQUEST_PATH_EXCLUDE: list[str] = [  # JWT / RBAC whitelist
        f'/admin{FASTAPI_API_V1_PATH}/auth/login',
        f'/admin{FASTAPI_API_V1_PATH}/auth/token/new',
        # Shop (client app mounted at the root): an expired access token must
        # not block the WhatsApp login or the refresh.
        f'{FASTAPI_API_V1_PATH}/auth/whatsapp/request-otp',
        f'{FASTAPI_API_V1_PATH}/auth/whatsapp/verify-otp',
        f'{FASTAPI_API_V1_PATH}/auth/refresh',
    ]

    # JWT
    JWT_USER_REDIS_PREFIX: str = 'foody:user'
    JWT_ADMIN_REDIS_PREFIX: str = 'foody:admin'
    JWT_USER_REDIS_EXPIRE_SECONDS: int = 60 * 60 * 24 * 7

    # Permission (RBAC)
    PERMISSION_MODE: Literal['casbin', 'role-menu'] = 'casbin'
    PERMISSION_REDIS_PREFIX: str = 'foody:permission'

    # Casbin RBAC whitelist
    RBAC_CASBIN_EXCLUDE: set[tuple[str, str]] = {
        ('POST', f'/admin{FASTAPI_API_V1_PATH}/auth/logout'),
        ('POST', f'/admin{FASTAPI_API_V1_PATH}/auth/token/new'),
    }

    # Role-Menu
    RBAC_ROLE_MENU_EXCLUDE: list[str] = [
        'sys:monitor:redis',
        'sys:monitor:server',
    ]

    # Cookies
    COOKIE_REFRESH_TOKEN_KEY: str = 'foody_refresh_token'
    # Follows TOKEN_REFRESH_EXPIRE_SECONDS (see _sync_cookie_lifetime) unless set.
    COOKIE_REFRESH_TOKEN_EXPIRE_SECONDS: int = 0
    # Secure cookie flags. 'lax' works for a same-site front/back (e.g.
    # localhost:3000 -> localhost:8000); use 'none' + secure for cross-domain.
    # COOKIE_SECURE is forced on outside dev (see auth_service), so the refresh
    # token is never sent over plain HTTP in production.
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal['lax', 'strict', 'none'] = 'lax'

    # WhatsApp OTP login (via gowa / go-whatsapp-web-multidevice), ported from
    # SignalLab. The WhatsApp number is the customer's account identifier: a
    # verified code logs in, creating the account on first use.
    OTP_LENGTH: int = 6
    OTP_TTL_SECONDS: int = 600          # code lifetime
    OTP_MAX_ATTEMPTS: int = 5           # wrong tries before the code is burned
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    # Anti-spam: per phone number, independent of the (CI-carrier-shared) IP.
    OTP_MAX_SENDS_PER_PHONE_HOUR: int = 5
    OTP_REDIS_PREFIX: str = 'foody:otp'
    # Prepended to a local number typed without its country code (07 88 ...).
    PHONE_DEFAULT_COUNTRY_CODE: str = '225'
    GOWA_URL: str = ''
    GOWA_BASIC_USER: str = ''
    GOWA_BASIC_PASS: str = ''
    GOWA_TIMEOUT: int = 20
    # WhatsApp numbers that get the admin role when they log in (bootstrap the
    # back-office without a shell). Any format: 07..., +225..., 225...
    ADMIN_PHONES: list[str] = []

    # Shop. Every amount is an integer number of FCFA.
    DELIVERY_FEE: int = 1500
    # Subtotal from which delivery is free (0 = never free).
    FREE_DELIVERY_THRESHOLD: int = 0
    DELIVERY_COMMUNES: list[str] = [
        'Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Cocody',
        'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville',
        'Yopougon',
    ]
    PICKUP_ADDRESS: str = ''
    # Payment methods offered at checkout ('cash' = paiement à la livraison).
    PAYMENT_METHODS_ENABLED: list[str] = ['cash']
    ORDER_MAX_QUANTITY_PER_ITEM: int = 50
    UPLOAD_MAX_BYTES: int = 15 * 1024 * 1024

    # Log
    LOG_ROOT_LEVEL: str = 'NOTSET'
    LOG_STD_FORMAT: str = (
        '<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</> | <lvl>{level: <8}</> | '
        '<cyan> {correlation_id} </> | <lvl>{message}</>'
    )
    LOG_LOGURU_FORMAT: str = (
        '<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</> | <lvl>{level: <8}</> | '
        '<cyan> {correlation_id} </> | <lvl>{message}</>'
    )
    LOG_CID_DEFAULT_VALUE: str = '-'
    LOG_CID_UUID_LENGTH: int = 32  # must <= 32
    LOG_STDOUT_LEVEL: str = 'INFO'
    LOG_STDERR_LEVEL: str = 'ERROR'
    LOG_STDOUT_FILENAME: str = 'foody_access.log'
    LOG_STDERR_FILENAME: str = 'foody_error.log'

    # Middleware
    MIDDLEWARE_CORS: bool = True
    MIDDLEWARE_ACCESS: bool = True

    # Trace ID
    TRACE_ID_REQUEST_HEADER_KEY: str = 'X-Request-ID'

    # Host header guard (TrustedHostMiddleware). Empty = any host (dev only).
    # In prod: the public domain and the internal alias the web proxy calls.
    TRUSTED_HOSTS: list[str] = []

    # CORS
    CORS_ALLOWED_ORIGINS: list[str] = [
        'http://localhost:3000',  # Front-end address, no trailing '/'
    ]
    CORS_EXPOSE_HEADERS: list[str] = [
        TRACE_ID_REQUEST_HEADER_KEY,
    ]

    # DateTime
    DATETIME_TIMEZONE: str = 'Africa/Abidjan'
    DATETIME_FORMAT: str = '%Y-%m-%d %H:%M:%S'

    # Request limiter
    REQUEST_LIMITER_REDIS_PREFIX: str = 'foody:limiter'

    # Demo mode (only GET, OPTIONS requests are allowed)
    DEMO_MODE: bool = False
    DEMO_MODE_EXCLUDE: set[tuple[str, str]] = {
        ('POST', f'{FASTAPI_API_V1_PATH}/auth/login'),
        ('POST', f'{FASTAPI_API_V1_PATH}/auth/logout'),
        ('GET', f'{FASTAPI_API_V1_PATH}/auth/captcha'),
    }

    # IP geolocation of requests. Default 'false' (no external call). 'online'
    # sends each client IP to ip-api.com over HTTP (privacy + latency — opt in
    # explicitly). 'offline' needs ip2region.xdb in backend/static/ (~11MB, not
    # shipped): download from https://github.com/lionsoul2014/ip2region
    IP_LOCATION_PARSE: Literal['online', 'offline', 'false'] = 'false'
    IP_LOCATION_REDIS_PREFIX: str = 'foody:ip:location'
    IP_LOCATION_EXPIRE_SECONDS: int = 60 * 60 * 24 * 1

    # Opera log
    OPERA_LOG_PATH_EXCLUDE: list[str] = [
        '/favicon.ico',
        FASTAPI_DOCS_URL,
        FASTAPI_REDOCS_URL,
        FASTAPI_OPENAPI_URL,
        f'{FASTAPI_API_V1_PATH}/auth/login/swagger',
    ]
    OPERA_LOG_ENCRYPT_TYPE: int = 1  # 0: AES; 1: md5; 2: ItsDangerous; 3: plain; other: ******
    OPERA_LOG_ENCRYPT_KEY_INCLUDE: list[str] = [  # values to encrypt in request bodies
        'password',
        'old_password',
        'new_password',
        'confirm_password',
        'code',  # WhatsApp OTP
    ]

    @model_validator(mode='after')
    def _sync_cookie_lifetime(self) -> 'Settings':
        # A class-level default would freeze the 90-day value even when
        # TOKEN_REFRESH_EXPIRE_SECONDS is overridden from the environment.
        if not self.COOKIE_REFRESH_TOKEN_EXPIRE_SECONDS:
            self.COOKIE_REFRESH_TOKEN_EXPIRE_SECONDS = self.TOKEN_REFRESH_EXPIRE_SECONDS
        return self

    @model_validator(mode='after')
    def _enforce_production_safety(self) -> 'Settings':
        """Refuse to boot in a non-dev environment with insecure defaults.

        In ``dev`` everything boots out of the box for a zero-friction first
        run. In ``preprod``/``prod``, leaving a development secret or a default
        infra credential in place is a critical vulnerability (forgeable JWTs,
        world-readable storage), so fail fast with an actionable message instead
        of starting a compromised server.
        """
        if self.ENVIRONMENT == 'dev':
            return self

        insecure: list[str] = []
        if self.TOKEN_SECRET_KEY == 'dev-insecure-change-me-token-secret-key':
            insecure.append(
                'TOKEN_SECRET_KEY  '
                '(generate: python -c "import secrets; print(secrets.token_urlsafe(32))")'
            )
        if self.OPERA_LOG_ENCRYPT_SECRET_KEY == 'dev-insecure-change-me-opera-log-key':
            insecure.append(
                'OPERA_LOG_ENCRYPT_SECRET_KEY  '
                '(generate: python -c "import os; print(os.urandom(32).hex())")'
            )
        if self.POSTGRES_PASSWORD == 'postgres':
            insecure.append('POSTGRES_PASSWORD  (still the default "postgres")')
        if self.MINIO_SECRET_KEY == 'minioadmin':
            insecure.append('MINIO_SECRET_KEY  (still the default "minioadmin")')
        if not self.TRUSTED_HOSTS:
            insecure.append(
                'TRUSTED_HOSTS  (empty: the app would accept any Host header, '
                'enabling host-header poisoning of links and cache keys)'
            )

        if insecure:
            raise ValueError(
                f'ENVIRONMENT={self.ENVIRONMENT!r} but insecure development defaults '
                'are still in use:\n'
                + '\n'.join(f'  - {item}' for item in insecure)
                + '\nSet real values in your .env before deploying. '
                '(This check only runs outside dev.)'
            )
        return self


@lru_cache
def get_settings() -> Settings:
    """Return the cached global settings instance."""
    return Settings()


# Configuration instance
settings = get_settings()

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, jwk
import urllib.request
import json
import time
from loguru import logger

from app.core.config import settings
from app.core.security import ALGORITHM
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.user import User
from app.core.constants import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/admin/login") # Fallback to admin/login

# Cache for JWKS keys to avoid querying on every single request
_jwks_cache = None
_jwks_last_fetched = 0

async def verify_oidc_token(token: str) -> dict:
    global _jwks_cache, _jwks_last_fetched
    now = time.time()
    if not _jwks_cache or now - _jwks_last_fetched > 3600:
        try:
            req = urllib.request.urlopen(settings.OIDC_JWKS_URL)
            _jwks_cache = json.loads(req.read().decode("utf-8"))
            _jwks_last_fetched = now
        except Exception as e:
            logger.error(f"Failed to fetch OIDC JWKS: {str(e)}")
            raise HTTPException(status_code=500, detail="Identity provider connection error")

    try:
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token format")

    key_dict = None
    for key in _jwks_cache.get("keys", []):
        if key.get("kid") == kid:
            key_dict = key
            break

    if not key_dict:
        raise HTTPException(status_code=401, detail="Token signing key not found")

    try:
        public_key = jwk.construct(key_dict)
        payload = jwt.decode(
            token,
            public_key.to_dict(),
            algorithms=key_dict.get("alg", "RS256"),
            audience=settings.OIDC_AUDIENCE
        )
        return payload
    except Exception as e:
        logger.warning(f"OIDC Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid identity provider token")

async def get_current_user(
    db: AsyncSession = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_email = None
    user_id = None
    
    if settings.OIDC_ENABLED:
        try:
            payload = await verify_oidc_token(token)
            user_email = payload.get("email")
            if not user_email:
                user_id = payload.get("sub")
        except HTTPException as e:
            raise e
        except Exception:
            raise credentials_exception
    else:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
        except Exception:
            raise credentials_exception
            
    if user_email:
        result = await db.execute(select(User).filter(User.email == user_email))
    elif user_id:
        result = await db.execute(select(User).filter(User.id == int(user_id)))
    else:
        raise credentials_exception
        
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in self.allowed_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user

def require_role(roles: list[UserRole]):
    return RoleChecker(roles)

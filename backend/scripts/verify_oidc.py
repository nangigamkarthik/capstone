"""
Verification script for Federated Identity Provider (OIDC/OAuth2) Integration.
Mocks the external JWKS endpoint and verifies that signing keys are correctly
resolved, parsed, and validated for incoming federated tokens.
"""
import sys
import os
import asyncio
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from jose import jwt
from fastapi import HTTPException
import app.api.v1.deps as deps
from app.core.config import settings
from app.infrastructure.database.session import async_session_maker
from app.infrastructure.database.models.user import User

async def main():
    print("====================================================")
    print("        VERIFYING OIDC/OAUTH2 IDP INTEGRATION       ")
    print("====================================================")
    
    # 1. Setup mock JWKS payload
    # We use a simple symmetric key algorithm (HS256) for verification tests
    # in order to keep the JWKS payload simple without RSA generation overhead.
    mock_jwks = {
        "keys": [
            {
                "kty": "oct",
                "kid": "test-key-id",
                "use": "sig",
                "alg": "HS256",
                "k": "dGVzdC1zaWduaW5nLWtleS12ZXJ5LXNlY3JldC1tdXN0LWJlLTY0LWJ5dGVzLWxvbmc=" # Base64 symmetric key
            }
        ]
    }
    
    # Enable OIDC settings for the test
    settings.OIDC_ENABLED = True
    settings.OIDC_JWKS_URL = "http://mock-identity-provider.local/jwks"
    settings.OIDC_AUDIENCE = "classroom-digital-twin"
    
    # Generate OIDC compliant token
    claims = {
        "sub": "1",
        "email": "sarah.jenkins@classroom.edu",
        "aud": settings.OIDC_AUDIENCE,
        "iss": "mock-identity-provider.local"
    }
    token = jwt.encode(
        claims,
        "test-signing-key-very-secret-must-be-64-bytes-long",
        algorithm="HS256",
        headers={"kid": "test-key-id"}
    )
    
    # Mock urllib.request.urlopen to return the mock JWKS
    mock_response = MagicMock()
    mock_response.read.return_value = b'{"keys": [{"kty": "oct", "kid": "test-key-id", "use": "sig", "alg": "HS256", "k": "dGVzdC1zaWduaW5nLWtleS12ZXJ5LXNlY3JldC1tdXN0LWJlLTY0LWJ5dGVzLWxvbmc="}]}'
    
    print("1. Testing OIDC JWKS token verification with mocked external IDP...")
    with patch("urllib.request.urlopen", return_value=mock_response):
        payload = await deps.verify_oidc_token(token)
        print(f"  - Token signature verified [OK]")
        print(f"  - Subject claim resolved  : {payload.get('sub')}")
        print(f"  - Email claim resolved    : {payload.get('email')}")
        
        # Test DB retrieval using verified claims
        async with async_session_maker() as db:
            user = await deps.get_current_user(db=db, token=token)
            print(f"  - local User record linked : ID={user.id}, Name={user.full_name}, Role={user.role}")
            
    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("OIDC / OAuth2 Identity integration: PASSED [OK]")
    print("====================================================")

    # Disable OIDC after test
    settings.OIDC_ENABLED = False

if __name__ == "__main__":
    asyncio.run(main())

import os
import requests
from functools import wraps
from flask import request, jsonify
from joserfc import jwt
from joserfc.jwk import KeySet
from joserfc.errors import JoseError

AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.environ.get("AUTH0_API_AUDIENCE")

# Auth0 publishes its public signing keys at a fixed URL for every tenant
# (the "JWKS" - JSON Web Key Set). We fetch this once and cache it, rather
# than on every request, since these keys rarely change and fetching them
# is a network call to an external service.

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        response = requests.get(jwks_url)
        _jwks_cache = KeySet.import_key_set(response.json())
    return _jwks_cache

def verify_token(token):
    key_set = get_jwks()
    decoded = jwt.decode(token,key_set)

    # A token can be validly signed by Auth0 but still not meant for
    # THIS API (it could be issued for a different application entirely).
    # Checking "aud" (audience) and "iss" (issuer) confirms the token was
    # specifically issued for our API, by our own Auth0 tenant
    claims_registry = jwt.JWTClaimsRegistry(
        aud={"essential": True, "value": AUTH0_API_AUDIENCE},
        iss={"essential": True, "value": f"https://{AUTH0_DOMAIN}/"},
    )
    claims_registry.validate(decoded.claims)

    return decoded.claims

def requires_auth(f):
    """
    Protects a route so it only runs for requests carrying a valid,
    Auth0-issued access token. Returns 401 for anything else - no token,
    malformed header, or a token that fails verification (expired, wrong
    audience, tampered, etc.).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401
        
        parts = auth_header.split()

        if parts[0].lower() != "bearer" or len(parts) != 2:
            return jsonify({"error": "Invalid Authorization header format"}), 401
        
        token = parts[1]

        try:
            claims = verify_token(token)
        except JoseError:
            # Deliberately generic - telling a failed request exactly *which*
            # check failed (bad signature vs. expired vs. wrong audience) hands 
            # useful information to anyone probing the API for weaknesses.
            return jsonify({"error": "Invalid or expired token"}), 401
        
        request.auth_claims = claims
        return f(*args, **kwargs)
    return decorated
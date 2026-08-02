"""Lambda authoriser for the trustee-only routes.

Verifies the Google ID token properly — signature, issuer, audience, and expiry
— then checks the verified email against the trustee allowlist. Both checks
matter: a valid Google token only proves the caller owns *some* Google account,
not that they are a trustee.
"""

from __future__ import annotations

import os
from typing import Any

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

# Reused across invocations so warm containers avoid re-fetching Google's keys.
_request = google_requests.Request()

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def _allowed_emails() -> set[str]:
    raw = os.environ.get("ALLOWED_TRUSTEE_EMAILS", "")
    return {entry.strip().lower() for entry in raw.split(",") if entry.strip()}


def _deny() -> dict[str, Any]:
    return {"isAuthorized": False}


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    token = _bearer_token(event)
    if not token:
        return _deny()

    client_id = os.environ["GOOGLE_CLIENT_ID"]

    try:
        claims = id_token.verify_oauth2_token(token, _request, client_id)
    except ValueError:
        # Covers a bad signature, the wrong audience, and an expired token.
        return _deny()

    if claims.get("iss") not in GOOGLE_ISSUERS:
        return _deny()

    # Google sets email_verified for accounts whose address it has confirmed.
    if not claims.get("email_verified", False):
        return _deny()

    email = (claims.get("email") or "").lower()
    if not email or email not in _allowed_emails():
        return _deny()

    return {
        "isAuthorized": True,
        # Surfaced to handlers as requestContext.authorizer.lambda.*
        "context": {"email": email, "name": claims.get("name", "")},
    }


def _bearer_token(event: dict[str, Any]) -> str | None:
    headers = event.get("headers") or {}
    # API Gateway lowercases header names, but be tolerant.
    raw = headers.get("authorization") or headers.get("Authorization")
    if not raw:
        return None
    parts = raw.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None

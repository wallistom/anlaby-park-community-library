"""Lambda authoriser for the trustee-only routes.

Verifies the Google ID token properly — signature, issuer, audience, and expiry
— then checks the verified email against the trustee allowlist. Both checks
matter: a valid Google token only proves the caller owns *some* Google account,
not that they are a trustee.

The allowlist is the union of two sources:

  * the trustees table, which trustees maintain themselves at /admin/trustees;
  * ALLOWED_TRUSTEE_EMAILS, a break-glass list held in Terraform.

The second exists so the site cannot be locked out of itself. If the table is
emptied by accident, or DynamoDB is unreachable, whoever operates the
infrastructure can still sign in and put it right. It is deliberately not
editable from the admin area.

The table is read on every invocation rather than cached here. API Gateway
already caches this authoriser's verdict for five minutes, so invocations are
rare, and a scan of a table this small costs half a read unit. Caching twice
would only make removing somebody slower and harder to reason about.
"""

from __future__ import annotations

import os
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

# Reused across invocations so warm containers avoid re-fetching Google's keys.
_request = google_requests.Request()

# Built on first use, then reused. Not at import: that would make the module
# require a configured region merely to be imported.
_dynamodb = None


def _table():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb.Table(os.environ["TRUSTEES_TABLE"])

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def _break_glass_emails() -> set[str]:
    raw = os.environ.get("ALLOWED_TRUSTEE_EMAILS", "")
    return {entry.strip().lower() for entry in raw.split(",") if entry.strip()}


def _table_emails() -> set[str]:
    """Trustees the charity manages itself.

    A read failure returns nothing rather than raising: the break-glass list
    still applies, so the operator can get in and fix whatever broke. It never
    widens access, only narrows it.
    """
    if not os.environ.get("TRUSTEES_TABLE"):
        return set()
    try:
        result = _table().scan(ProjectionExpression="email")
    except (BotoCoreError, ClientError):
        return set()
    return {
        (item.get("email") or "").strip().lower()
        for item in result.get("Items", [])
        if item.get("email")
    }


def _allowed_emails() -> set[str]:
    return _break_glass_emails() | _table_emails()


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

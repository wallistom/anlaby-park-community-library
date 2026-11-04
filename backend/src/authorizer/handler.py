from __future__ import annotations

import os
from typing import Any

from botocore.exceptions import BotoCoreError, ClientError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from common import db

_request = google_requests.Request()

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def _break_glass_emails() -> set[str]:
    raw = os.environ.get("ALLOWED_TRUSTEE_EMAILS", "")
    return {entry.strip().lower() for entry in raw.split(",") if entry.strip()}


def _table_emails() -> set[str]:
    if not os.environ.get("TRUSTEES_TABLE"):
        return set()
    try:
        result = db.table("TRUSTEES_TABLE").scan(ProjectionExpression="email")
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
        return _deny()

    if claims.get("iss") not in GOOGLE_ISSUERS:
        return _deny()

    if not claims.get("email_verified", False):
        return _deny()

    email = (claims.get("email") or "").lower()
    if not email or email not in _allowed_emails():
        return _deny()

    return {
        "isAuthorized": True,
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

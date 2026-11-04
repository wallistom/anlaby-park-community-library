from __future__ import annotations

from typing import Any

from common import responses


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    claims = (
        event.get("requestContext", {}).get("authorizer", {}).get("lambda", {}) or {}
    )
    email = claims.get("email", "")

    if not email:
        return responses.forbidden("Not a trustee account.")

    return responses.ok({"email": email, "name": claims.get("name", "") or email})

from __future__ import annotations

from typing import Any

from common import db, responses


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        result = db.table("TRUSTEES_TABLE").scan()
    except Exception:
        return responses.server_error("We could not load the trustee list.")

    caller = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("lambda", {})
        .get("email", "")
    ).lower()

    trustees = [
        {
            "email": item.get("email", ""),
            "name": item.get("name", ""),
            "addedAt": item.get("addedAt", ""),
            "addedBy": item.get("addedBy", ""),
            "isYou": item.get("email", "").lower() == caller,
        }
        for item in result.get("Items", [])
    ]
    trustees.sort(key=lambda t: t["name"].lower() or t["email"])
    return responses.ok(trustees)

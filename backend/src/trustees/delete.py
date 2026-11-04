from __future__ import annotations

from typing import Any
from urllib.parse import unquote

from common import db, responses


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    raw = event.get("pathParameters", {}).get("email", "")
    email = unquote(raw).strip().lower()
    if not email:
        return responses.bad_request("No address given.")

    caller = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("lambda", {})
        .get("email", "")
    ).lower()

    if email == caller:
        return responses.bad_request(
            "You cannot remove your own access. Ask another trustee to do it."
        )

    table = db.table("TRUSTEES_TABLE")

    try:
        existing = table.scan(ProjectionExpression="email")
    except Exception:
        return responses.server_error("We could not check the trustee list.")

    emails = {(item.get("email") or "").lower() for item in existing.get("Items", [])}
    if email not in emails:
        return responses.not_found("That person is not on the list.")
    if len(emails) <= 1:
        return responses.bad_request(
            "This is the last trustee. Add somebody else before removing them."
        )

    try:
        table.delete_item(Key={"email": email})
    except Exception:
        return responses.server_error("We could not remove that person.")

    return responses.no_content()

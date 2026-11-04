from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError

MAX_TRUSTEES = 50


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    caller = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("lambda", {})
        .get("email", "")
    ).lower()

    try:
        body = validation.parse_body(event)
        email = validation.require_email(body)
        name = validation.require_string(body, "name", max_length=80)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    table = db.table("TRUSTEES_TABLE")

    try:
        existing = table.scan(ProjectionExpression="email")
    except Exception:
        return responses.server_error("We could not check the trustee list.")

    emails = {(item.get("email") or "").lower() for item in existing.get("Items", [])}
    if email in emails:
        return responses.bad_request(f"{email} can already sign in.")
    if len(emails) >= MAX_TRUSTEES:
        return responses.bad_request(f"There is a limit of {MAX_TRUSTEES} trustees.")

    item = {
        "email": email,
        "name": name,
        "addedAt": db.now_iso(),
        "addedBy": caller,
    }

    try:
        table.put_item(Item=item)
    except Exception:
        return responses.server_error("We could not add that person.")

    return responses.created({**item, "isYou": email == caller})

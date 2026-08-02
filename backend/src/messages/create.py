"""POST /messages — public contact form."""

from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        body = validation.parse_body(event)
        item: dict[str, Any] = {
            "name": validation.require_string(body, "name", max_length=120),
            "email": validation.require_email(body),
            "subject": validation.require_string(body, "subject", max_length=140),
            "message": validation.require_string(
                body, "message", min_length=10, max_length=4000
            ),
        }
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    item["messageId"] = db.new_id()
    item["status"] = "new"
    item["submittedAt"] = db.now_iso()

    try:
        db.table("MESSAGES_TABLE").put_item(Item=item)
    except Exception:  # noqa: BLE001
        return responses.server_error("We could not send that message.")


    return responses.created({"messageId": item["messageId"]})

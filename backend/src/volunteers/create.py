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
            "availability": validation.require_string(
                body, "availability", max_length=500
            ),
            "interests": validation.require_string_list(body, "interests"),
        }
        phone = validation.optional_string(body, "phone", max_length=40)
        message = validation.optional_string(body, "message", max_length=2000)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    if phone:
        item["phone"] = phone
    if message:
        item["message"] = message

    item["applicationId"] = db.new_id()
    item["status"] = "new"
    item["submittedAt"] = db.now_iso()

    try:
        db.table("VOLUNTEERS_TABLE").put_item(Item=item)
    except Exception:
        return responses.server_error("We could not send your details.")

    return responses.created({"applicationId": item["applicationId"]})

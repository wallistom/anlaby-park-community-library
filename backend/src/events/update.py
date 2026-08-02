"""PUT /admin/events/{eventId} — replace an existing event."""

from __future__ import annotations

from typing import Any

from botocore.exceptions import ClientError

from common import db, responses, validation
from common.validation import ValidationError
from events.create import _event_fields


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        event_id = validation.path_parameter(event, "eventId")
        body = validation.parse_body(event)
        item = _event_fields(body)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    item["eventId"] = event_id

    try:
        db.table("EVENTS_TABLE").put_item(
            Item=item,
            # Refuse to resurrect an event another trustee has just deleted.
            ConditionExpression="attribute_exists(eventId)",
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return responses.not_found("That event no longer exists.")
        return responses.server_error("We could not save that event.")
    except Exception:  # noqa: BLE001
        return responses.server_error("We could not save that event.")

    return responses.ok(item)

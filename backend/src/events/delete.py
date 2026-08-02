"""DELETE /admin/events/{eventId}."""

from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        event_id = validation.path_parameter(event, "eventId")
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    try:
        db.table("EVENTS_TABLE").delete_item(Key={"eventId": event_id})
    except Exception:  # noqa: BLE001
        return responses.server_error("We could not delete that event.")

    return responses.no_content()

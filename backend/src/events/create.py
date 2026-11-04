from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError


def event_fields(body: dict[str, Any]) -> dict[str, Any]:
    start_date = validation.require_date(body, "date")
    repeats = validation.require_recurrence(body)

    item: dict[str, Any] = {
        "title": validation.require_string(body, "title", max_length=140),
        "date": start_date,
        "description": validation.require_string(body, "description", max_length=2000),
        "location": validation.require_string(body, "location", max_length=140),
        "published": validation.optional_bool(body, "published", default=False),
        "recurrence": repeats,
    }

    until = validation.repeat_until(body, repeats, start_date)
    start_time = validation.optional_time(body, "startTime")
    end_time = validation.optional_time(body, "endTime")
    cost = validation.optional_string(body, "cost", max_length=100)

    if until:
        item["repeatUntil"] = until
    if start_time:
        item["startTime"] = start_time
    if end_time:
        item["endTime"] = end_time
    if cost:
        item["cost"] = cost

    return item


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        body = validation.parse_body(event)
        item = event_fields(body)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    item["eventId"] = db.new_id()

    try:
        db.table("EVENTS_TABLE").put_item(Item=item)
    except Exception:
        return responses.server_error("We could not save that event.")

    return responses.created(item)

from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError

SETTINGS_ID = "library"
MAX_EXCEPTIONS = 200


def _day(entry: Any, index: int) -> dict[str, Any]:
    if not isinstance(entry, dict):
        raise ValidationError(f"Day {index} is not valid.")

    day_index = validation.require_int(entry, "dayIndex", minimum=0, maximum=6)
    closed = validation.optional_bool(entry, "closed", default=False)
    day: dict[str, Any] = {"dayIndex": day_index, "closed": closed}

    if closed:
        return day

    opens = validation.optional_time(entry, "opensAt")
    closes = validation.optional_time(entry, "closesAt")
    if not opens or not closes:
        raise ValidationError("An open day needs both an opening and a closing time.")
    if opens >= closes:
        raise ValidationError("A day cannot close before it opens.")

    day["opensAt"] = opens
    day["closesAt"] = closes
    return day


def _exception(entry: Any, index: int) -> dict[str, Any]:
    if not isinstance(entry, dict):
        raise ValidationError(f"Exception {index} is not valid.")

    start = validation.require_date(entry, "from")
    end = validation.require_date(entry, "to")
    if end < start:
        raise ValidationError("An exception cannot end before it starts.")

    closed = validation.optional_bool(entry, "closed", default=True)
    reason = validation.require_string(entry, "reason", max_length=120)

    result: dict[str, Any] = {
        "exceptionId": validation.optional_string(entry, "exceptionId", max_length=64)
        or db.new_id(),
        "from": start,
        "to": end,
        "closed": closed,
        "reason": reason,
    }

    if not closed:
        opens = validation.optional_time(entry, "opensAt")
        closes = validation.optional_time(entry, "closesAt")
        if not opens or not closes:
            raise ValidationError(
                "An exception that is not a closure needs opening and closing times."
            )
        if opens >= closes:
            raise ValidationError("An exception cannot close before it opens.")
        result["opensAt"] = opens
        result["closesAt"] = closes

    return result


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        body = validation.parse_body(event)

        pattern_raw = body.get("pattern")
        if not isinstance(pattern_raw, list) or len(pattern_raw) != 7:
            raise ValidationError("'pattern' must contain all seven days.")
        pattern = [_day(entry, i) for i, entry in enumerate(pattern_raw)]
        if len({day["dayIndex"] for day in pattern}) != 7:
            raise ValidationError("'pattern' must contain each weekday exactly once.")

        exceptions_raw = body.get("exceptions", [])
        if not isinstance(exceptions_raw, list):
            raise ValidationError("'exceptions' must be a list.")
        if len(exceptions_raw) > MAX_EXCEPTIONS:
            raise ValidationError(f"No more than {MAX_EXCEPTIONS} exceptions.")
        exceptions = [_exception(entry, i) for i, entry in enumerate(exceptions_raw)]

        notice_raw = body.get("notice") or {}
        if not isinstance(notice_raw, dict):
            raise ValidationError("'notice' must be an object.")
        notice = {
            "active": validation.optional_bool(notice_raw, "active", default=False),
            "title": validation.optional_string(notice_raw, "title", max_length=140) or "",
            "body": validation.optional_string(notice_raw, "body", max_length=600) or "",
        }
        if notice["active"] and not notice["title"]:
            raise ValidationError("A notice that is showing needs a title.")
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    item = {
        "settingId": SETTINGS_ID,
        "pattern": pattern,
        "exceptions": exceptions,
        "notice": notice,
        "updatedAt": db.now_iso(),
    }

    try:
        db.table("SETTINGS_TABLE").put_item(Item=item)
    except Exception:
        return responses.server_error("We could not save those settings.")

    return responses.ok(
        {"pattern": pattern, "exceptions": exceptions, "notice": notice}
    )

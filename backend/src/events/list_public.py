"""GET /events — published, upcoming occurrences for the public website.

Repeating events are stored once and expanded here, so the website shows real
dates rather than "every Tuesday" and the trustees only maintain one record.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from common import db, recurrence, responses


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        items = db.scan_all(db.table("EVENTS_TABLE"))
    except Exception:  # noqa: BLE001 - never leak internals to the public
        return responses.server_error()

    today = date.today()
    occurrences: list[dict[str, Any]] = []

    for item in items:
        if item.get("published") is not True:
            continue
        occurrences.extend(recurrence.expand(item, today))

    occurrences.sort(key=lambda item: (str(item.get("date", "")), str(item.get("startTime", ""))))

    return responses.ok(occurrences)

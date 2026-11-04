from __future__ import annotations

from datetime import date
from typing import Any

from common import db, recurrence, responses


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        items = db.scan_all(db.table("EVENTS_TABLE"))
    except Exception:
        return responses.server_error()

    today = date.today()
    occurrences: list[dict[str, Any]] = []

    for item in items:
        if item.get("published") is not True:
            continue
        occurrences.extend(recurrence.expand(item, today))

    occurrences.sort(key=lambda item: (str(item.get("date", "")), str(item.get("startTime", ""))))

    return responses.ok(occurrences)

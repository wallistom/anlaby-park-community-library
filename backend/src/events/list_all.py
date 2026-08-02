"""GET /admin/events — every event, including drafts and past dates."""

from __future__ import annotations

from typing import Any

from common import db, responses


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        items = db.scan_all(db.table("EVENTS_TABLE"))
    except Exception:  # noqa: BLE001
        return responses.server_error()

    items.sort(key=lambda item: str(item.get("date", "")))
    return responses.ok(items)

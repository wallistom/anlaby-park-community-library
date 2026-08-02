"""GET /settings — opening hours, exceptions and the site notice.

Public and unauthenticated: the hours are the most public thing the library
has. Returns an empty object when nothing has been saved yet, and the frontend
falls back to its compiled-in defaults, so the site is never blank.
"""

from __future__ import annotations

from typing import Any

from common import db, responses

SETTINGS_ID = "library"


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        result = db.table("SETTINGS_TABLE").get_item(Key={"settingId": SETTINGS_ID})
    except Exception:  # noqa: BLE001 - never leak internals to the public
        return responses.server_error()

    item = result.get("Item")
    if not item:
        # Nothing saved yet. The client already holds sensible defaults, so an
        # empty object is the honest answer rather than a 404.
        return responses.ok({})

    return responses.ok(
        {
            "pattern": item.get("pattern", []),
            "exceptions": item.get("exceptions", []),
            "notice": item.get("notice", {}),
        }
    )

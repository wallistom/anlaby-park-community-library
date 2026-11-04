from __future__ import annotations

from typing import Any

from common import db, responses

SETTINGS_ID = "library"


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        result = db.table("SETTINGS_TABLE").get_item(Key={"settingId": SETTINGS_ID})
    except Exception:
        return responses.server_error()

    item = result.get("Item")
    if not item:
        return responses.ok({})

    return responses.ok(
        {
            "pattern": item.get("pattern", []),
            "exceptions": item.get("exceptions", []),
            "notice": item.get("notice", {}),
        }
    )

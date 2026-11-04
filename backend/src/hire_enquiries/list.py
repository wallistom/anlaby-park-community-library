from __future__ import annotations

from typing import Any

from common import db, responses


def handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        items = db.scan_all(db.table("HIRE_ENQUIRIES_TABLE"))
    except Exception:
        return responses.server_error()

    items.sort(key=lambda item: str(item.get("submittedAt", "")), reverse=True)
    return responses.ok(items)

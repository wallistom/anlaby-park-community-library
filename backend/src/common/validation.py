from __future__ import annotations

import json
import re
from typing import Any

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ISO_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

VALID_STATUSES = {"new", "in_progress", "closed"}
VALID_RECURRENCES = {"none", "daily", "weekly", "fortnightly", "monthly"}


class ValidationError(Exception):
    pass


def parse_body(event: dict[str, Any]) -> dict[str, Any]:
    raw = event.get("body")
    if not raw:
        raise ValidationError("A request body is required.")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValidationError("The request body must be valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise ValidationError("The request body must be a JSON object.")
    return parsed


def require_string(
    body: dict[str, Any],
    field: str,
    *,
    min_length: int = 1,
    max_length: int = 2000,
) -> str:
    value = body.get(field)
    if not isinstance(value, str):
        raise ValidationError(f"'{field}' is required.")
    value = value.strip()
    if len(value) < min_length:
        raise ValidationError(f"'{field}' must be at least {min_length} characters.")
    if len(value) > max_length:
        raise ValidationError(f"'{field}' must be {max_length} characters or fewer.")
    return value


def optional_string(
    body: dict[str, Any], field: str, *, max_length: int = 2000
) -> str | None:
    value = body.get(field)
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise ValidationError(f"'{field}' must be text.")
    value = value.strip()
    if len(value) > max_length:
        raise ValidationError(f"'{field}' must be {max_length} characters or fewer.")
    return value or None


def require_email(body: dict[str, Any], field: str = "email") -> str:
    value = require_string(body, field, max_length=254)
    if not EMAIL_PATTERN.match(value):
        raise ValidationError("Please provide a valid email address.")
    return value.lower()


def require_date(body: dict[str, Any], field: str) -> str:
    value = require_string(body, field, max_length=10)
    if not ISO_DATE_PATTERN.match(value):
        raise ValidationError(f"'{field}' must be a date in YYYY-MM-DD form.")
    return value


def optional_time(body: dict[str, Any], field: str) -> str | None:
    value = optional_string(body, field, max_length=5)
    if value is not None and not TIME_PATTERN.match(value):
        raise ValidationError(f"'{field}' must be a time in HH:MM form.")
    return value


def require_int(body: dict[str, Any], field: str, *, minimum: int, maximum: int) -> int:
    value = body.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValidationError(f"'{field}' must be a number.")
    value = int(value)
    if value < minimum or value > maximum:
        raise ValidationError(f"'{field}' must be between {minimum} and {maximum}.")
    return value


def optional_bool(body: dict[str, Any], field: str, *, default: bool = False) -> bool:
    value = body.get(field, default)
    if not isinstance(value, bool):
        raise ValidationError(f"'{field}' must be true or false.")
    return value


def require_string_list(
    body: dict[str, Any], field: str, *, max_items: int = 20, max_length: int = 200
) -> list[str]:
    value = body.get(field, [])
    if not isinstance(value, list):
        raise ValidationError(f"'{field}' must be a list.")
    if len(value) > max_items:
        raise ValidationError(f"'{field}' may contain at most {max_items} entries.")
    result: list[str] = []
    for entry in value:
        if not isinstance(entry, str):
            raise ValidationError(f"'{field}' must contain only text entries.")
        entry = entry.strip()
        if len(entry) > max_length:
            raise ValidationError(f"Entries in '{field}' are too long.")
        if entry:
            result.append(entry)
    return result


def require_status(body: dict[str, Any]) -> str:
    value = require_string(body, "status", max_length=20)
    if value not in VALID_STATUSES:
        raise ValidationError(
            f"'status' must be one of: {', '.join(sorted(VALID_STATUSES))}."
        )
    return value


def require_recurrence(body: dict[str, Any]) -> str:
    value = body.get("recurrence", "none")
    if not isinstance(value, str) or value not in VALID_RECURRENCES:
        raise ValidationError(
            f"'recurrence' must be one of: {', '.join(sorted(VALID_RECURRENCES))}."
        )
    return value


def repeat_until(body: dict[str, Any], recurrence: str, start_date: str) -> str | None:
    if recurrence == "none":
        return None

    value = body.get("repeatUntil")
    if not isinstance(value, str) or not ISO_DATE_PATTERN.match(value.strip()):
        raise ValidationError(
            "'repeatUntil' must be a date in YYYY-MM-DD form when an event repeats."
        )

    value = value.strip()
    if value < start_date:
        raise ValidationError("'repeatUntil' cannot be before the event's first date.")
    return value


def path_parameter(event: dict[str, Any], name: str) -> str:
    value = (event.get("pathParameters") or {}).get(name)
    if not value:
        raise ValidationError(f"'{name}' is missing from the URL.")
    return value

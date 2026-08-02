"""Expanding repeating events into dated occurrences.

A weekly group is stored as a single record with a `recurrence` and a
`repeatUntil`. The public feed turns that into the individual dates people
actually want to see, within a bounded window so a long-running club does not
produce thousands of rows.
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any

# How far ahead the public feed looks. Long enough to plan around, short enough
# that a weekly club stays readable.
HORIZON_DAYS = 120

# Backstop against a misconfigured event flooding the response.
MAX_OCCURRENCES_PER_EVENT = 200

_STEP_DAYS = {"daily": 1, "weekly": 7, "fortnightly": 14}


def _parse(value: Any) -> date | None:
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None


def _add_months(start: date, months: int) -> date:
    """
    Adds whole months, clamping to the end of a short month.

    A monthly event starting on the 31st therefore lands on the 30th in April
    and the 28th in February, rather than being skipped.
    """
    total = start.month - 1 + months
    year = start.year + total // 12
    month = total % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def expand(event: dict[str, Any], today: date) -> list[dict[str, Any]]:
    """
    Returns the occurrences of `event` falling between `today` and the horizon.

    One-off events yield at most a single entry. Anything unparseable yields
    nothing rather than raising — a single malformed record should not take the
    whole public events feed down with it.
    """
    start = _parse(event.get("date"))
    if start is None:
        return []

    horizon = today + timedelta(days=HORIZON_DAYS)
    recurrence = str(event.get("recurrence", "none") or "none")

    if recurrence == "none":
        if start < today or start > horizon:
            return []
        return [_occurrence(event, start, is_repeat=False)]

    # A repeat with no valid end date is treated as ending at the horizon
    # rather than running forever.
    until = _parse(event.get("repeatUntil")) or horizon
    last = min(until, horizon)

    occurrences: list[dict[str, Any]] = []
    current = start
    index = 0

    while current <= last and len(occurrences) < MAX_OCCURRENCES_PER_EVENT:
        if current >= today:
            occurrences.append(_occurrence(event, current, is_repeat=index > 0))

        index += 1
        if recurrence == "monthly":
            current = _add_months(start, index)
        else:
            step = _STEP_DAYS.get(recurrence)
            if step is None:
                break
            current = start + timedelta(days=step * index)

    return occurrences


def _occurrence(event: dict[str, Any], on: date, *, is_repeat: bool) -> dict[str, Any]:
    """Copies the event, stamped with the date of this particular instance."""
    instance = dict(event)
    instance["date"] = on.isoformat()
    instance["occurrenceId"] = f"{event.get('eventId', '')}:{on.isoformat()}"
    instance["isRepeat"] = is_repeat
    return instance

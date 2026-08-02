"""Tests for expanding repeating events into dated occurrences."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from common import recurrence  # noqa: E402

TODAY = date(2026, 8, 1)  # a Saturday


def event(**overrides):
    base = {
        "eventId": "e1",
        "title": "Baby Bounce",
        "date": "2026-08-04",  # Tuesday
        "description": "Rhymes and songs.",
        "location": "The Greenway",
        "published": True,
        "recurrence": "none",
    }
    base.update(overrides)
    return base


def dates(occurrences):
    return [item["date"] for item in occurrences]


class OneOffTests(unittest.TestCase):
    def test_single_upcoming_occurrence(self) -> None:
        result = recurrence.expand(event(), TODAY)
        self.assertEqual(dates(result), ["2026-08-04"])
        self.assertFalse(result[0]["isRepeat"])

    def test_today_counts_as_upcoming(self) -> None:
        result = recurrence.expand(event(date="2026-08-01"), TODAY)
        self.assertEqual(dates(result), ["2026-08-01"])

    def test_past_event_is_dropped(self) -> None:
        self.assertEqual(recurrence.expand(event(date="2026-07-30"), TODAY), [])

    def test_beyond_horizon_is_dropped(self) -> None:
        self.assertEqual(recurrence.expand(event(date="2027-06-01"), TODAY), [])


class WeeklyTests(unittest.TestCase):
    def test_expands_to_each_week(self) -> None:
        result = recurrence.expand(
            event(recurrence="weekly", repeatUntil="2026-08-25"), TODAY
        )
        self.assertEqual(
            dates(result),
            ["2026-08-04", "2026-08-11", "2026-08-18", "2026-08-25"],
        )

    def test_repeat_until_is_inclusive(self) -> None:
        result = recurrence.expand(
            event(recurrence="weekly", repeatUntil="2026-08-11"), TODAY
        )
        self.assertEqual(dates(result), ["2026-08-04", "2026-08-11"])

    def test_only_first_instance_is_not_a_repeat(self) -> None:
        result = recurrence.expand(
            event(recurrence="weekly", repeatUntil="2026-08-18"), TODAY
        )
        self.assertEqual([item["isRepeat"] for item in result], [False, True, True])

    def test_occurrence_ids_are_unique(self) -> None:
        result = recurrence.expand(
            event(recurrence="weekly", repeatUntil="2026-09-01"), TODAY
        )
        ids = [item["occurrenceId"] for item in result]
        self.assertEqual(len(ids), len(set(ids)))

    def test_series_started_in_the_past_resumes_from_today(self) -> None:
        # A club running since June should show its next dates, not its history.
        result = recurrence.expand(
            event(date="2026-06-02", recurrence="weekly", repeatUntil="2026-08-25"),
            TODAY,
        )
        self.assertEqual(dates(result), ["2026-08-04", "2026-08-11", "2026-08-18", "2026-08-25"])

    def test_ends_at_horizon_when_repeat_until_is_far_away(self) -> None:
        result = recurrence.expand(
            event(recurrence="weekly", repeatUntil="2030-01-01"), TODAY
        )
        horizon = TODAY + timedelta(days=recurrence.HORIZON_DAYS)
        self.assertLessEqual(date.fromisoformat(dates(result)[-1]), horizon)
        self.assertGreater(len(result), 10)


class FortnightlyAndDailyTests(unittest.TestCase):
    def test_fortnightly(self) -> None:
        result = recurrence.expand(
            event(recurrence="fortnightly", repeatUntil="2026-09-15"), TODAY
        )
        self.assertEqual(
            dates(result), ["2026-08-04", "2026-08-18", "2026-09-01", "2026-09-15"]
        )

    def test_daily(self) -> None:
        result = recurrence.expand(
            event(recurrence="daily", repeatUntil="2026-08-07"), TODAY
        )
        self.assertEqual(
            dates(result),
            ["2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07"],
        )


class MonthlyTests(unittest.TestCase):
    def test_same_day_each_month(self) -> None:
        result = recurrence.expand(
            event(date="2026-08-10", recurrence="monthly", repeatUntil="2026-11-10"),
            TODAY,
        )
        self.assertEqual(
            dates(result), ["2026-08-10", "2026-09-10", "2026-10-10", "2026-11-10"]
        )

    def test_clamps_to_short_months(self) -> None:
        # September has 30 days, so the 31st has to land on the 30th.
        result = recurrence.expand(
            event(date="2026-08-31", recurrence="monthly", repeatUntil="2026-09-30"),
            TODAY,
        )
        self.assertEqual(dates(result), ["2026-08-31", "2026-09-30"])

    def test_horizon_wins_over_a_later_repeat_until(self) -> None:
        # The horizon falls on 29 November, so a 30 November occurrence is out.
        result = recurrence.expand(
            event(date="2026-08-31", recurrence="monthly", repeatUntil="2026-11-30"),
            TODAY,
        )
        self.assertEqual(dates(result), ["2026-08-31", "2026-09-30", "2026-10-31"])

    def test_clamping_does_not_drift(self) -> None:
        # After clamping to the 30th in September, October must return to 31.
        result = recurrence.expand(
            event(date="2026-08-31", recurrence="monthly", repeatUntil="2026-10-31"),
            TODAY,
        )
        self.assertEqual(dates(result)[-1], "2026-10-31")


class RobustnessTests(unittest.TestCase):
    def test_unparseable_date_yields_nothing(self) -> None:
        self.assertEqual(recurrence.expand(event(date="next Tuesday"), TODAY), [])

    def test_missing_date_yields_nothing(self) -> None:
        broken = event()
        del broken["date"]
        self.assertEqual(recurrence.expand(broken, TODAY), [])

    def test_unknown_recurrence_does_not_loop_forever(self) -> None:
        result = recurrence.expand(
            event(recurrence="hourly", repeatUntil="2026-12-01"), TODAY
        )
        self.assertLessEqual(len(result), 1)

    def test_repeat_without_end_date_is_capped_at_horizon(self) -> None:
        result = recurrence.expand(event(recurrence="weekly"), TODAY)
        self.assertGreater(len(result), 0)
        self.assertLessEqual(len(result), recurrence.MAX_OCCURRENCES_PER_EVENT)

    def test_daily_repeat_respects_the_occurrence_cap(self) -> None:
        result = recurrence.expand(
            event(recurrence="daily", repeatUntil="2030-01-01"), TODAY
        )
        self.assertLessEqual(len(result), recurrence.MAX_OCCURRENCES_PER_EVENT)


if __name__ == "__main__":
    unittest.main()

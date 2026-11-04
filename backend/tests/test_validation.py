from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from common import validation
from common.validation import ValidationError


class ParseBodyTests(unittest.TestCase):
    def test_parses_json_object(self) -> None:
        self.assertEqual(validation.parse_body({"body": json.dumps({"a": 1})}), {"a": 1})

    def test_rejects_missing_body(self) -> None:
        with self.assertRaises(ValidationError):
            validation.parse_body({})

    def test_rejects_malformed_json(self) -> None:
        with self.assertRaises(ValidationError):
            validation.parse_body({"body": "{not json"})

    def test_rejects_non_object_json(self) -> None:
        with self.assertRaises(ValidationError):
            validation.parse_body({"body": "[1, 2, 3]"})


class StringTests(unittest.TestCase):
    def test_trims_whitespace(self) -> None:
        self.assertEqual(validation.require_string({"name": "  Ada  "}, "name"), "Ada")

    def test_rejects_missing(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string({}, "name")

    def test_rejects_whitespace_only(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string({"name": "   "}, "name")

    def test_enforces_max_length(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string({"name": "x" * 51}, "name", max_length=50)

    def test_enforces_min_length(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string({"m": "short"}, "m", min_length=10)

    def test_optional_string_returns_none_when_blank(self) -> None:
        self.assertIsNone(validation.optional_string({"phone": "  "}, "phone"))
        self.assertIsNone(validation.optional_string({}, "phone"))


class EmailTests(unittest.TestCase):
    def test_accepts_and_lowercases(self) -> None:
        self.assertEqual(
            validation.require_email({"email": "Reader@Example.COM"}), "reader@example.com"
        )

    def test_rejects_invalid(self) -> None:
        for value in ["nope", "a@b", "a b@c.com", "@example.com", "a@.com"]:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    validation.require_email({"email": value})


class DateAndTimeTests(unittest.TestCase):
    def test_accepts_iso_date(self) -> None:
        self.assertEqual(validation.require_date({"date": "2026-09-14"}, "date"), "2026-09-14")

    def test_rejects_other_formats(self) -> None:
        for value in ["14/09/2026", "2026-9-4", "next Tuesday"]:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    validation.require_date({"date": value}, "date")

    def test_accepts_24_hour_time(self) -> None:
        self.assertEqual(validation.optional_time({"t": "19:30"}, "t"), "19:30")
        self.assertEqual(validation.optional_time({"t": "00:00"}, "t"), "00:00")

    def test_rejects_out_of_range_time(self) -> None:
        for value in ["24:00", "7:30pm", "19:60"]:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    validation.optional_time({"t": value}, "t")

    def test_time_is_optional(self) -> None:
        self.assertIsNone(validation.optional_time({}, "t"))


class IntTests(unittest.TestCase):
    def test_accepts_within_range(self) -> None:
        self.assertEqual(
            validation.require_int({"n": 12}, "n", minimum=1, maximum=200), 12
        )

    def test_rejects_out_of_range(self) -> None:
        for value in [0, 201, -5]:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    validation.require_int({"n": value}, "n", minimum=1, maximum=200)

    def test_rejects_booleans(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_int({"n": True}, "n", minimum=1, maximum=200)

    def test_rejects_text(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_int({"n": "twelve"}, "n", minimum=1, maximum=200)


class StatusTests(unittest.TestCase):
    def test_accepts_known_statuses(self) -> None:
        for value in ["new", "in_progress", "closed"]:
            with self.subTest(value=value):
                self.assertEqual(validation.require_status({"status": value}), value)

    def test_rejects_anything_else(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_status({"status": "deleted"})


class StringListTests(unittest.TestCase):
    def test_drops_blanks_and_trims(self) -> None:
        result = validation.require_string_list({"i": [" Baking ", "", "Displays"]}, "i")
        self.assertEqual(result, ["Baking", "Displays"])

    def test_defaults_to_empty(self) -> None:
        self.assertEqual(validation.require_string_list({}, "i"), [])

    def test_rejects_too_many(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string_list({"i": ["x"] * 21}, "i")

    def test_rejects_non_list(self) -> None:
        with self.assertRaises(ValidationError):
            validation.require_string_list({"i": "Baking"}, "i")


class PathParameterTests(unittest.TestCase):
    def test_reads_parameter(self) -> None:
        event = {"pathParameters": {"eventId": "abc"}}
        self.assertEqual(validation.path_parameter(event, "eventId"), "abc")

    def test_rejects_missing(self) -> None:
        with self.assertRaises(ValidationError):
            validation.path_parameter({}, "eventId")


if __name__ == "__main__":
    unittest.main()

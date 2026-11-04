import json
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from trustees import create, delete


def _event(caller, body=None, path=None):
    e = {"requestContext": {"authorizer": {"lambda": {"email": caller}}}}
    if body is not None:
        e["body"] = json.dumps(body)
    if path is not None:
        e["pathParameters"] = {"email": path}
    return e


def _table(emails):
    t = MagicMock()
    t.scan.return_value = {"Items": [{"email": e} for e in emails]}
    return t


class AddTrusteeTest(unittest.TestCase):
    def test_adds_a_new_trustee_and_records_who_did_it(self):
        table = _table(["chair@example.org"])
        with patch("trustees.create.db.table", return_value=table):
            r = create.handler(
                _event("chair@example.org", {"email": "New@Example.org", "name": "New Person"}),
                None,
            )
        self.assertEqual(r["statusCode"], 201)
        saved = table.put_item.call_args.kwargs["Item"]
        self.assertEqual(saved["email"], "new@example.org")
        self.assertEqual(saved["addedBy"], "chair@example.org")

    def test_refuses_a_duplicate(self):
        table = _table(["chair@example.org"])
        with patch("trustees.create.db.table", return_value=table):
            r = create.handler(
                _event("chair@example.org", {"email": "CHAIR@example.org", "name": "Chair"}), None
            )
        self.assertEqual(r["statusCode"], 400)
        table.put_item.assert_not_called()

    def test_refuses_a_malformed_address(self):
        table = _table(["chair@example.org"])
        with patch("trustees.create.db.table", return_value=table):
            r = create.handler(_event("chair@example.org", {"email": "nope", "name": "X"}), None)
        self.assertEqual(r["statusCode"], 400)


class RemoveTrusteeTest(unittest.TestCase):
    def test_removes_another_trustee(self):
        table = _table(["chair@example.org", "old@example.org"])
        with patch("trustees.delete.db.table", return_value=table):
            r = delete.handler(_event("chair@example.org", path="old@example.org"), None)
        self.assertEqual(r["statusCode"], 204)
        table.delete_item.assert_called_once_with(Key={"email": "old@example.org"})

    def test_refuses_to_remove_yourself(self):
        table = _table(["chair@example.org", "other@example.org"])
        with patch("trustees.delete.db.table", return_value=table):
            r = delete.handler(_event("chair@example.org", path="Chair@Example.org"), None)
        self.assertEqual(r["statusCode"], 400)
        table.delete_item.assert_not_called()

    def test_refuses_to_remove_the_last_trustee(self):
        table = _table(["only@example.org"])
        with patch("trustees.delete.db.table", return_value=table):
            r = delete.handler(_event("chair@example.org", path="only@example.org"), None)
        self.assertEqual(r["statusCode"], 400)
        table.delete_item.assert_not_called()

    def test_url_encoded_addresses_are_decoded(self):
        table = _table(["chair@example.org", "old@example.org"])
        with patch("trustees.delete.db.table", return_value=table):
            r = delete.handler(_event("chair@example.org", path="old%40example.org"), None)
        self.assertEqual(r["statusCode"], 204)

    def test_unknown_address_is_not_found(self):
        table = _table(["chair@example.org", "other@example.org"])
        with patch("trustees.delete.db.table", return_value=table):
            r = delete.handler(_event("chair@example.org", path="ghost@example.org"), None)
        self.assertEqual(r["statusCode"], 404)


if __name__ == "__main__":
    unittest.main()

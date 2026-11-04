import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from admin import whoami


def _event(claims):
    context = {}
    if claims is not None:
        context = {"authorizer": {"lambda": claims}}
    return {"requestContext": context}


class WhoAmITest(unittest.TestCase):
    def test_returns_the_verified_identity(self):
        response = whoami.handler(
            _event({"email": "trustee@example.org", "name": "A Trustee"}), None
        )
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(
            json.loads(response["body"]),
            {"email": "trustee@example.org", "name": "A Trustee"},
        )

    def test_falls_back_to_the_email_when_google_sends_no_name(self):
        response = whoami.handler(_event({"email": "trustee@example.org"}), None)
        self.assertEqual(json.loads(response["body"])["name"], "trustee@example.org")

    def test_refuses_when_the_authoriser_context_is_missing(self):
        for claims in (None, {}, {"name": "No Email"}, {"email": ""}):
            with self.subTest(claims=claims):
                response = whoami.handler(_event(claims), None)
                self.assertEqual(response["statusCode"], 403)


if __name__ == "__main__":
    unittest.main()

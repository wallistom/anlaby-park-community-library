"""GET /admin/me.

The handler is trivial, but the frontend's route guard now depends on it: a 200
is what lets the trustee screens render at all. These pin the two things that
matter — a trustee gets their verified identity back, and a request that
somehow arrives without one is refused rather than treated as authorised.
"""

import json
import unittest

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

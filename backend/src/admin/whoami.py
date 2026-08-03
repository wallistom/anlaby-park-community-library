"""GET /admin/me — confirms the caller is a trustee.

The frontend needs an answer to "is this account allowed in the admin area?"
so it can refuse to render the trustee screens. It cannot work that out on its
own: the allowlist lives in the authoriser, and a Google ID token only proves
the caller owns *some* Google account.

The route sits behind the same authoriser as every other trustee endpoint, so
reaching this handler at all already means the caller passed. There is nothing
to check here — the handler exists to turn that fact into a 200, and to hand
back the verified identity rather than the client's own decoding of its token.

Deliberately touches no table.
"""

from __future__ import annotations

from typing import Any

from common import responses


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    claims = (
        event.get("requestContext", {}).get("authorizer", {}).get("lambda", {}) or {}
    )
    email = claims.get("email", "")

    # The authoriser always sets this on success. An empty value means the route
    # was reached without it, which should be impossible — fail closed rather
    # than hand back a blank identity the client would read as "trustee".
    if not email:
        return responses.forbidden("Not a trustee account.")

    return responses.ok({"email": email, "name": claims.get("name", "") or email})

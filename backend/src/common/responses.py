from __future__ import annotations

import json
from decimal import Decimal
from typing import Any


class _DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            return int(o) if o == o.to_integral_value() else float(o)
        return super().default(o)


def _response(status_code: int, body: Any | None = None) -> dict[str, Any]:
    response: dict[str, Any] = {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
    }
    if body is not None:
        response["body"] = json.dumps(body, cls=_DecimalEncoder)
    return response


def ok(body: Any) -> dict[str, Any]:
    return _response(200, body)


def created(body: Any) -> dict[str, Any]:
    return _response(201, body)


def no_content() -> dict[str, Any]:
    return _response(204)


def bad_request(message: str) -> dict[str, Any]:
    return _response(400, {"error": message})


def forbidden(message: str = "Not allowed") -> dict[str, Any]:
    return _response(403, {"error": message})


def not_found(message: str = "Not found") -> dict[str, Any]:
    return _response(404, {"error": message})


def server_error(message: str = "Something went wrong") -> dict[str, Any]:
    return _response(500, {"error": message})

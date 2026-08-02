"""Shared HTTP response helpers for the API Gateway HTTP API handlers."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any


class _DecimalEncoder(json.JSONEncoder):
    """DynamoDB returns numbers as ``Decimal``, which ``json`` cannot encode."""

    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            # Attendee counts and the like are whole numbers; keep them integral
            # so the frontend does not receive "10.0".
            return int(o) if o == o.to_integral_value() else float(o)
        return super().default(o)


def _response(status_code: int, body: Any | None = None) -> dict[str, Any]:
    """Builds a proxy response.

    CORS headers are added by the API Gateway CORS configuration rather than
    here, so handlers never have to think about them.
    """
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


def not_found(message: str = "Not found") -> dict[str, Any]:
    return _response(404, {"error": message})


def server_error(message: str = "Something went wrong") -> dict[str, Any]:
    return _response(500, {"error": message})

"""DynamoDB access helpers.

Table names arrive as environment variables so the same code runs against any
Terraform workspace without change.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3

_dynamodb = boto3.resource("dynamodb")


def table(env_var: str):
    """Returns the DynamoDB table named by ``env_var``."""
    name = os.environ[env_var]
    return _dynamodb.Table(name)


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    """Current UTC time as an ISO-8601 string, used for `submittedAt`."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def scan_all(dynamo_table) -> list[dict[str, Any]]:
    """Returns every item in a table, following pagination.

    A scan is the right tool here: these tables hold a community library's
    events and enquiries, so they are measured in hundreds of rows, not
    millions. If that ever changes, add a GSI on `status` and query instead.
    """
    items: list[dict[str, Any]] = []
    kwargs: dict[str, Any] = {}
    while True:
        response = dynamo_table.scan(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        kwargs["ExclusiveStartKey"] = last_key

"""PATCH /admin/volunteers/{applicationId}."""

from __future__ import annotations

from typing import Any

from botocore.exceptions import ClientError

from common import db, responses, validation
from common.validation import ValidationError


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        application_id = validation.path_parameter(event, "applicationId")
        body = validation.parse_body(event)
        status = validation.require_status(body)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    try:
        db.table("VOLUNTEERS_TABLE").update_item(
            Key={"applicationId": application_id},
            UpdateExpression="SET #status = :status",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":status": status},
            ConditionExpression="attribute_exists(applicationId)",
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return responses.not_found("That enquiry no longer exists.")
        return responses.server_error()
    except Exception:  # noqa: BLE001
        return responses.server_error()

    return responses.no_content()

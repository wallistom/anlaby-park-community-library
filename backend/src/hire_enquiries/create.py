"""POST /hire-enquiries — public room hire enquiry."""

from __future__ import annotations

from typing import Any

from common import db, responses, validation
from common.validation import ValidationError


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        body = validation.parse_body(event)
        item: dict[str, Any] = {
            "name": validation.require_string(body, "name", max_length=120),
            "email": validation.require_email(body),
            "preferredDate": validation.require_date(body, "preferredDate"),
            "frequency": validation.require_string(body, "frequency", max_length=60),
            "attendees": validation.require_int(
                body, "attendees", minimum=1, maximum=200
            ),
            "message": validation.require_string(
                body, "message", min_length=10, max_length=2000
            ),
        }
        phone = validation.optional_string(body, "phone", max_length=40)
        organisation = validation.optional_string(body, "organisation", max_length=140)
    except ValidationError as exc:
        return responses.bad_request(str(exc))

    if phone:
        item["phone"] = phone
    if organisation:
        item["organisation"] = organisation

    # Status and timestamps are set here, never taken from the request.
    item["enquiryId"] = db.new_id()
    item["status"] = "new"
    item["submittedAt"] = db.now_iso()

    try:
        db.table("HIRE_ENQUIRIES_TABLE").put_item(Item=item)
    except Exception:  # noqa: BLE001
        return responses.server_error("We could not send that enquiry.")

    # Only the id goes back; echoing the submission serves no purpose.
    return responses.created({"enquiryId": item["enquiryId"]})

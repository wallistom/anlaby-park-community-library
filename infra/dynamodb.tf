# ---------------------------------------------------------------------------
# DynamoDB tables
#
# One table per entity, all on-demand billing. Volumes here are a community
# library's worth of events and enquiries, so provisioned capacity would cost
# more than it saves. Point-in-time recovery is on for everything that holds
# personal data.
# ---------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_dynamodb_table" "events" {
  name         = "${local.name_prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "hire_enquiries" {
  name         = "${local.name_prefix}-hire-enquiries"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "enquiryId"

  attribute {
    name = "enquiryId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "volunteers" {
  name         = "${local.name_prefix}-volunteers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "applicationId"

  attribute {
    name = "applicationId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "messages" {
  name         = "${local.name_prefix}-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}


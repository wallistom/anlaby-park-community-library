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


# A single item holds the weekly pattern, the dated exceptions and the site
# notice. One row rather than a table of exceptions because there is one
# library, the whole thing is read on every page load, and saving it atomically
# means two trustees can never leave the hours half-updated.
resource "aws_dynamodb_table" "settings" {
  name         = "${local.name_prefix}-settings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "settingId"

  attribute {
    name = "settingId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

# Trustees the charity manages itself, through /admin/trustees. The break-glass
# accounts in var.allowed_trustee_emails are separate and stay in Terraform, so
# the site can always be recovered if this table is emptied by accident.
resource "aws_dynamodb_table" "trustees" {
  name         = "${local.name_prefix}-trustees"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

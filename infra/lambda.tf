# ---------------------------------------------------------------------------
# Lambda functions
#
# One function per endpoint. They share a single source archive but each has
# its own handler entrypoint, its own IAM role, and permission for only the
# tables and actions it actually uses — so a flaw in the public contact form
# cannot read the volunteer table.
# ---------------------------------------------------------------------------

data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/src"
  output_path = "${path.module}/.build/source.zip"
  excludes    = ["**/__pycache__/**"]
}

data "archive_file" "layer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/build/layer"
  output_path = "${path.module}/.build/layer.zip"
}

resource "aws_lambda_layer_version" "dependencies" {
  layer_name          = "${local.name_prefix}-dependencies"
  filename            = data.archive_file.layer.output_path
  source_code_hash    = data.archive_file.layer.output_base64sha256
  compatible_runtimes = [var.lambda_runtime]
  description         = "google-auth and its transitive dependencies."
}

locals {
  # Every endpoint, with the least privilege it can do its job with.
  functions = {
    # --- Events -----------------------------------------------------------
    list_public_events = {
      handler   = "events.list_public.handler"
      env       = { EVENTS_TABLE = aws_dynamodb_table.events.name }
      resources = [aws_dynamodb_table.events.arn]
      actions   = ["dynamodb:Scan"]
    }
    list_all_events = {
      handler   = "events.list_all.handler"
      env       = { EVENTS_TABLE = aws_dynamodb_table.events.name }
      resources = [aws_dynamodb_table.events.arn]
      actions   = ["dynamodb:Scan"]
    }
    create_event = {
      handler   = "events.create.handler"
      env       = { EVENTS_TABLE = aws_dynamodb_table.events.name }
      resources = [aws_dynamodb_table.events.arn]
      actions   = ["dynamodb:PutItem"]
    }
    update_event = {
      handler   = "events.update.handler"
      env       = { EVENTS_TABLE = aws_dynamodb_table.events.name }
      resources = [aws_dynamodb_table.events.arn]
      actions   = ["dynamodb:PutItem"]
    }
    delete_event = {
      handler   = "events.delete.handler"
      env       = { EVENTS_TABLE = aws_dynamodb_table.events.name }
      resources = [aws_dynamodb_table.events.arn]
      actions   = ["dynamodb:DeleteItem"]
    }

    # --- Room hire --------------------------------------------------------
    create_hire_enquiry = {
      handler   = "hire_enquiries.create.handler"
      env       = { HIRE_ENQUIRIES_TABLE = aws_dynamodb_table.hire_enquiries.name }
      resources = [aws_dynamodb_table.hire_enquiries.arn]
      actions   = ["dynamodb:PutItem"]
    }
    list_hire_enquiries = {
      handler   = "hire_enquiries.list.handler"
      env       = { HIRE_ENQUIRIES_TABLE = aws_dynamodb_table.hire_enquiries.name }
      resources = [aws_dynamodb_table.hire_enquiries.arn]
      actions   = ["dynamodb:Scan"]
    }
    update_hire_enquiry_status = {
      handler   = "hire_enquiries.update_status.handler"
      env       = { HIRE_ENQUIRIES_TABLE = aws_dynamodb_table.hire_enquiries.name }
      resources = [aws_dynamodb_table.hire_enquiries.arn]
      actions   = ["dynamodb:UpdateItem"]
    }

    # --- Volunteers -------------------------------------------------------
    create_volunteer_application = {
      handler   = "volunteers.create.handler"
      env       = { VOLUNTEERS_TABLE = aws_dynamodb_table.volunteers.name }
      resources = [aws_dynamodb_table.volunteers.arn]
      actions   = ["dynamodb:PutItem"]
    }
    list_volunteer_applications = {
      handler   = "volunteers.list.handler"
      env       = { VOLUNTEERS_TABLE = aws_dynamodb_table.volunteers.name }
      resources = [aws_dynamodb_table.volunteers.arn]
      actions   = ["dynamodb:Scan"]
    }
    update_volunteer_status = {
      handler   = "volunteers.update_status.handler"
      env       = { VOLUNTEERS_TABLE = aws_dynamodb_table.volunteers.name }
      resources = [aws_dynamodb_table.volunteers.arn]
      actions   = ["dynamodb:UpdateItem"]
    }

    # --- Messages ---------------------------------------------------------
    create_message = {
      handler   = "messages.create.handler"
      env       = { MESSAGES_TABLE = aws_dynamodb_table.messages.name }
      resources = [aws_dynamodb_table.messages.arn]
      actions   = ["dynamodb:PutItem"]
    }
    list_messages = {
      handler   = "messages.list.handler"
      env       = { MESSAGES_TABLE = aws_dynamodb_table.messages.name }
      resources = [aws_dynamodb_table.messages.arn]
      actions   = ["dynamodb:Scan"]
    }
    update_message_status = {
      handler   = "messages.update_status.handler"
      env       = { MESSAGES_TABLE = aws_dynamodb_table.messages.name }
      resources = [aws_dynamodb_table.messages.arn]
      actions   = ["dynamodb:UpdateItem"]
    }

  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "function" {
  for_each = local.functions

  name               = "${local.name_prefix}-${replace(each.key, "_", "-")}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "function_logs" {
  for_each = local.functions

  role       = aws_iam_role.function[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "function_dynamodb" {
  for_each = local.functions

  name = "dynamodb-access"
  role = aws_iam_role.function[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = each.value.actions
      Resource = each.value.resources
    }]
  })
}

resource "aws_cloudwatch_log_group" "function" {
  for_each = local.functions

  name              = "/aws/lambda/${local.name_prefix}-${replace(each.key, "_", "-")}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "function" {
  for_each = local.functions

  function_name = "${local.name_prefix}-${replace(each.key, "_", "-")}"
  role          = aws_iam_role.function[each.key].arn
  handler       = each.value.handler
  runtime       = var.lambda_runtime
  timeout       = 10
  memory_size   = 256

  filename         = data.archive_file.source.output_path
  source_code_hash = data.archive_file.source.output_base64sha256
  layers           = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = each.value.env
  }

  # Without this the function creates its own log group with no retention.
  depends_on = [aws_cloudwatch_log_group.function]
}

# ---------------------------------------------------------------------------
# Authoriser — verifies Google ID tokens for the /admin/* routes
# ---------------------------------------------------------------------------

resource "aws_iam_role" "authorizer" {
  name               = "${local.name_prefix}-authorizer"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "authorizer_logs" {
  role       = aws_iam_role.authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "authorizer" {
  name              = "/aws/lambda/${local.name_prefix}-authorizer"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "authorizer" {
  function_name = "${local.name_prefix}-authorizer"
  role          = aws_iam_role.authorizer.arn
  handler       = "authorizer.handler.handler"
  runtime       = var.lambda_runtime
  timeout       = 10
  memory_size   = 256

  filename         = data.archive_file.source.output_path
  source_code_hash = data.archive_file.source.output_base64sha256
  layers           = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = {
      GOOGLE_CLIENT_ID       = var.google_client_id
      ALLOWED_TRUSTEE_EMAILS = join(",", var.allowed_trustee_emails)
    }
  }

  depends_on = [aws_cloudwatch_log_group.authorizer]
}

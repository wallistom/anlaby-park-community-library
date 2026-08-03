# ---------------------------------------------------------------------------
# API Gateway (HTTP API)
#
# An HTTP API rather than a REST API: it is cheaper, has CORS built in, and
# supports the simple-response Lambda authoriser we use for the trustee routes.
# ---------------------------------------------------------------------------

locals {
  # The CloudFront domain is only known after apply, so it is appended here
  # rather than being something you have to paste into terraform.tfvars and
  # apply a second time.
  #
  # If you delete hosting.tf to host the frontend elsewhere, drop the
  # concat() and use var.allowed_origins directly.
  cors_origins = concat(
    var.allowed_origins,
    ["https://${aws_cloudfront_distribution.site.domain_name}"],
  )
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "Public forms and trustee administration for Anlaby Park Community Library."

  cors_configuration {
    allow_origins = local.cors_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 3600
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${local.name_prefix}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      httpMethod     = "$context.httpMethod"
      path           = "$context.path"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      requestTime    = "$context.requestTime"
      errorMessage   = "$context.error.message"
    })
  }
}

# --- Authoriser -------------------------------------------------------------

resource "aws_apigatewayv2_authorizer" "google" {
  api_id                            = aws_apigatewayv2_api.main.id
  name                              = "${local.name_prefix}-google-authorizer"
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  # Returns {isAuthorized: bool} rather than an IAM policy document.
  enable_simple_responses = true
  identity_sources        = ["$request.header.Authorization"]
  # Cached per distinct token, so a signed-in trustee is not re-verified on
  # every click. Short enough that removing someone takes effect quickly.
  authorizer_result_ttl_in_seconds = 300
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.google.id}"
}

# --- Routes -----------------------------------------------------------------

locals {
  # route_key -> which function serves it, and whether it needs a trustee.
  routes = {
    # Public
    "GET /events"          = { function = "list_public_events", protected = false }
    "POST /hire-enquiries" = { function = "create_hire_enquiry", protected = false }
    "POST /volunteers"     = { function = "create_volunteer_application", protected = false }
    "POST /messages"       = { function = "create_message", protected = false }
    "GET /settings"        = { function = "get_settings", protected = false }

    # Trustees only
    "GET /admin/me"                           = { function = "whoami", protected = true }
    "GET /admin/events"                       = { function = "list_all_events", protected = true }
    "POST /admin/events"                      = { function = "create_event", protected = true }
    "PUT /admin/events/{eventId}"             = { function = "update_event", protected = true }
    "DELETE /admin/events/{eventId}"          = { function = "delete_event", protected = true }
    "GET /admin/hire-enquiries"               = { function = "list_hire_enquiries", protected = true }
    "PATCH /admin/hire-enquiries/{enquiryId}" = { function = "update_hire_enquiry_status", protected = true }
    "GET /admin/volunteers"                   = { function = "list_volunteer_applications", protected = true }
    "PATCH /admin/volunteers/{applicationId}" = { function = "update_volunteer_status", protected = true }
    "GET /admin/messages"                     = { function = "list_messages", protected = true }
    "PUT /admin/settings"                     = { function = "update_settings", protected = true }
    "PATCH /admin/messages/{messageId}"       = { function = "update_message_status", protected = true }
  }
}

resource "aws_apigatewayv2_integration" "function" {
  for_each = local.functions

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.function[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.main.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.function[each.value.function].id}"

  authorization_type = each.value.protected ? "CUSTOM" : "NONE"
  authorizer_id      = each.value.protected ? aws_apigatewayv2_authorizer.google.id : null
}

resource "aws_lambda_permission" "api" {
  for_each = local.functions

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

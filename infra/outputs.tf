output "api_base_url" {
  description = "Copy into apiBaseUrl in src/environments/environment.prod.ts."
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "google_client_id" {
  description = "Copy into googleClientId in src/environments/environment.prod.ts."
  value       = var.google_client_id
}

output "dynamodb_tables" {
  description = "Table names, handy for the AWS console and for ad-hoc queries."
  value = {
    events         = aws_dynamodb_table.events.name
    hire_enquiries = aws_dynamodb_table.hire_enquiries.name
    volunteers     = aws_dynamodb_table.volunteers.name
    messages       = aws_dynamodb_table.messages.name
    settings       = aws_dynamodb_table.settings.name
  }
}

output "website_url" {
  description = "CloudFront URL for the built Angular app."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "website_bucket" {
  description = "S3 bucket to sync dist/ into when deploying the frontend."
  value       = aws_s3_bucket.site.id
}

output "allowed_trustee_emails" {
  description = "Accounts that can sign in to the trustee area."
  value       = var.allowed_trustee_emails
}

output "github_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE repository variable in GitHub Actions."
  value       = aws_iam_role.github_deploy.arn
}

output "cloudfront_distribution_id" {
  description = "Set as the CLOUDFRONT_DISTRIBUTION_ID repository variable."
  value       = aws_cloudfront_distribution.site.id
}

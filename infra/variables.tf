variable "aws_region" {
  description = "AWS region. London keeps personal data in the UK, which the privacy policy states."
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name, used to namespace every resource."
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Prefix applied to all resource names."
  type        = string
  default     = "apcl"
}

variable "google_client_id" {
  description = <<-EOT
    OAuth 2.0 Web client ID from the Google Cloud console. The authoriser checks
    that incoming ID tokens were issued for this client. Public by design — it
    is also compiled into the frontend bundle.
  EOT
  type        = string
}

variable "allowed_trustee_emails" {
  description = <<-EOT
    Google account addresses permitted to use the trustee admin area. A valid
    Google token alone is not enough; the address must appear here.
  EOT
  type        = list(string)

  validation {
    condition     = length(var.allowed_trustee_emails) > 0
    error_message = "At least one trustee email must be allowed, or nobody can administer the site."
  }
}

variable "allowed_origins" {
  description = "Origins permitted by CORS — the public website, plus localhost for development."
  type        = list(string)
  default = [
    "https://anlabyparkcommunitylibrary.com",
    "https://www.anlabyparkcommunitylibrary.com",
    "http://localhost:4200",
  ]
}

variable "lambda_runtime" {
  description = "Python runtime for every function. Keep in sync with backend/build.sh."
  type        = string
  default     = "python3.12"
}

variable "log_retention_days" {
  description = "How long CloudWatch keeps Lambda logs."
  type        = number
  default     = 30
}

variable "throttling_burst_limit" {
  description = "API Gateway burst limit. The public forms are unauthenticated, so this caps abuse."
  type        = number
  default     = 20
}

variable "throttling_rate_limit" {
  description = "API Gateway steady-state requests per second."
  type        = number
  default     = 10
}

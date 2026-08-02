# ---------------------------------------------------------------------------
# GitHub Actions deploy role
#
# CI authenticates by exchanging a short-lived GitHub OIDC token for temporary
# AWS credentials. No access keys are ever created, stored as repository
# secrets, or able to leak — which is the usual way a small project's AWS
# account gets compromised.
#
# The role can do exactly two things: put the built site into the website
# bucket, and invalidate the CloudFront cache. It deliberately cannot touch
# DynamoDB, Lambda, or Terraform state, so a compromised workflow cannot read
# volunteer details or alter the infrastructure.
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC endpoint is behind a well-known CA. AWS verifies the
  # certificate chain, so this thumbprint is a formality it still requires.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Scoped by the `repository` and `environment` claims rather than by `sub`.
    #
    # GitHub now issues an immutable subject with numeric owner and repository
    # IDs embedded in it, e.g.
    #   repo:owner@100294355/name@1319905089:environment:production
    # so matching `sub` against "owner/name" silently fails. These two claims
    # carry the plain values and are stable.
    #
    # Requiring `environment` also means only a job that declares
    # `environment: production` can assume the role — an incidental push
    # workflow cannot.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository"
      values   = [var.github_repository]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:environment"
      values   = ["production"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${local.name_prefix}-github-deploy"
  description        = "Lets GitHub Actions publish the built site. Nothing else."
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid    = "SyncWebsiteBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      aws_s3_bucket.site.arn,
      "${aws_s3_bucket.site.arn}/*",
    ]
  }

  statement {
    sid       = "InvalidateCache"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "publish-website"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}

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

locals {
  gh_owner = split("/", var.github_repository)[0]
  gh_repo  = split("/", var.github_repository)[1]
}

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

    # AWS refuses a trust policy for a GitHub OIDC provider unless it constrains
    # `sub` or `job_workflow_ref`, so `sub` is matched here — but loosely, and
    # then tightened by the exact claims below.
    #
    # GitHub now issues an immutable subject carrying numeric owner and
    # repository IDs, e.g.
    #   repo:owner@100294355/name@1319905089:environment:production
    # Matching "owner/name" alone silently never matches. Both shapes are
    # listed so this keeps working whichever format GitHub sends.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.gh_owner}/${local.gh_repo}:environment:production",
        "repo:${local.gh_owner}@*/${local.gh_repo}@*:environment:production",
      ]
    }

    # The real guarantees. These claims carry plain, unambiguous values, so a
    # repository that merely looked similar under the wildcard above still
    # cannot assume this role.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository"
      values   = [var.github_repository]
    }

    # Only a job declaring `environment: production` qualifies — an unrelated
    # workflow in this repository cannot reach AWS.
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

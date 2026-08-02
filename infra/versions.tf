terraform {
  required_version = ">= 1.5.0"

  # State lives in S3, not on one laptop. Without this, losing the machine that
  # ran the first apply would orphan every resource Terraform created, and CI
  # could never manage the estate at all.
  #
  # The bucket and lock table are bootstrapped outside Terraform — they have to
  # exist before this block can be used. See the "Terraform state" section of
  # the README if you ever need to recreate them.
  backend "s3" {
    bucket         = "apcl-tfstate-572643177124"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "apcl-tfstate-lock"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "anlaby-park-community-library"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

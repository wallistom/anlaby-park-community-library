terraform {
  required_version = ">= 1.5.0"

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

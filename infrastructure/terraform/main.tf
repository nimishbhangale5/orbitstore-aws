terraform {
  required_version = ">= 1.3.0"

  backend "s3" {
    bucket         = "orbitstore-terraform-state-098965823532"
    key            = "orbitstore/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "orbitstore-state-lock"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

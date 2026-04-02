output "website_url" {
  description = "Static website URL (S3 website endpoint)."
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "website_bucket_name" {
  description = "S3 bucket hosting the static website."
  value       = aws_s3_bucket.website.bucket
}

output "api_url" {
  description = "Base API URL for calling products/orders/health."
  value       = "https://${aws_api_gateway_rest_api.orbitstore.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "products_table_name" {
  value = aws_dynamodb_table.products.name
}

output "orders_table_name" {
  value = aws_dynamodb_table.orders.name
}

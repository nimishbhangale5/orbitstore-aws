data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../../backend/app.py"
  output_path = "${path.module}/orbitstore_lambda.zip"
}

resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-api-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  runtime          = "python3.11"
  handler          = "app.lambda_handler"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      ORDERS_TABLE   = aws_dynamodb_table.orders.name
    }
  }
}
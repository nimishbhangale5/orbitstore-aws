resource "aws_dynamodb_table" "products" {
  name         = "orbitstore-products"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "productId"

  attribute {
    name = "productId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "orders" {
  name         = "orbitstore-orders"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }
}

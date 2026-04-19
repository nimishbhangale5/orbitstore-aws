import base64
import json
import os
import time
import uuid
from decimal import Decimal

import boto3


class DecimalEncoder(json.JSONEncoder):
    """Serialize DynamoDB Decimal values into JSON-friendly numbers."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


dynamodb = boto3.resource("dynamodb")

PRODUCTS_TABLE_NAME = os.environ.get("PRODUCTS_TABLE_NAME", "orbitstore-products")
ORDERS_TABLE_NAME = os.environ.get("ORDERS_TABLE_NAME", "orbitstore-orders")

products_table = dynamodb.Table(PRODUCTS_TABLE_NAME)
orders_table = dynamodb.Table(ORDERS_TABLE_NAME)


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }


def _response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": _cors_headers(),
        "body": json.dumps(payload, cls=DecimalEncoder),
    }


def _read_event_body(event):
    body = event.get("body")
    if not body:
        return None

    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    return body


def _parse_json_body(event):
    body = _read_event_body(event)
    if not body:
        return {}
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return {}


def _get_path_and_method(event):
    path = event.get("path") or ""
    method = event.get("httpMethod") or event.get("requestContext", {}).get("httpMethod") or ""
    return path, method.upper()


def _health():
    return {"status": "ok", "ts": int(time.time())}


def _list_products():
    result = products_table.scan()
    items = result.get("Items", [])
    return {"products": items}


def _create_product(event):
    body = _parse_json_body(event)
    product_id = body.get("productId") or str(uuid.uuid4())

    # Accept a flexible schema but keep required fields for UI.
    product = {
        "productId": product_id,
        "name": body.get("name", "Unnamed Artifact"),
        "description": body.get("description", ""),
        "price": body.get("price", 0),
        "currency": body.get("currency", "USD"),
        "image": body.get("image", ""),
        "category": body.get("category", "Tech"),
        "tags": body.get("tags", []),
        "updatedAt": int(time.time()),
    }

    # DynamoDB can store Decimal; if the caller sent floats they’ll be coerced by boto3.
    products_table.put_item(Item=product)
    return {"productId": product_id, "created": True}


def _get_orders(event):
    # Optionally filter by orderId to avoid scanning everything.
    query = event.get("queryStringParameters") or {}
    order_id = query.get("orderId")
    if order_id:
        resp = orders_table.get_item(Key={"orderId": order_id})
        item = resp.get("Item")
        return {"orders": [item] if item else []}

    resp = orders_table.scan()
    return {"orders": resp.get("Items", [])}


def _create_order(event):
    body = _parse_json_body(event)
    items = body.get("items") or []
    currency = body.get("currency") or "USD"
    order_id = body.get("orderId") or str(uuid.uuid4())

    total = 0
    normalized_items = []
    for it in items:
        pid = it.get("productId") or it.get("id") or str(uuid.uuid4())
        name = it.get("name") or "Unknown Artifact"
        price = it.get("price", 0)
        qty = int(it.get("quantity") or 1)

        line_total = Decimal(str(price)) * qty
        total += float(line_total)

        normalized_items.append(
            {
                "productId": pid,
                "name": name,
                "price": price,
                "quantity": qty,
            }
        )

    order_item = {
        "orderId": order_id,
        "createdAt": int(time.time()),
        "status": "received",
        "currency": currency,
        "total": Decimal(str(total)),
        "items": normalized_items,
    }

    orders_table.put_item(Item=order_item)
    return {"orderId": order_id, "created": True, "total": order_item["total"]}


def lambda_handler(event, context):
    path, method = _get_path_and_method(event)

    # CORS preflight support.
    if method == "OPTIONS":
        return _response(200, {"ok": True})

    try:
        if path == "/products" and method == "GET":
            return _response(200, _list_products())
        if path == "/products" and method == "POST":
            return _response(201, _create_product(event))

        if path == "/orders" and method == "GET":
            return _response(200, _get_orders(event))
        if path == "/orders" and method == "POST":
            return _response(201, _create_order(event))

        if path == "/health" and method == "GET":
            return _response(200, _health())

        return _response(404, {"error": "Route not found", "path": path, "method": method})
    except Exception as exc:
        # Avoid leaking internal stack traces; keep it simple for a demo.
        return _response(500, {"error": "Internal server error", "message": str(exc)})

# ── LOCAL WEB SERVER (for Docker testing) ──
if __name__ == '__main__':
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import json

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            event = {'path': self.path, 'httpMethod': 'GET'}
            result = lambda_handler(event, None)
            self.send_response(result['statusCode'])
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(result['body'].encode())

        def do_POST(self):
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode()
            event = {'path': self.path, 'httpMethod': 'POST', 'body': body}
            result = lambda_handler(event, None)
            self.send_response(result['statusCode'])
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(result['body'].encode())

        def log_message(self, format, *args):
            print(f"[OrbitStore] {self.path} {args[1]}")

    print("🛸 OrbitStore API running on http://localhost:8080")
    HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
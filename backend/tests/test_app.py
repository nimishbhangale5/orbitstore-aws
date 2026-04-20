import json
import sys
import os

# Add backend folder to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import lambda_handler

def make_event(method, path, body=None):
    return {
        'httpMethod': method,
        'path': path,
        'body': json.dumps(body) if body else None
    }

def test_health_endpoint():
    event = make_event('GET', '/health')
    response = lambda_handler(event, None)
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'status' in body

def test_invalid_route():
    event = make_event('GET', '/invalid-route')
    response = lambda_handler(event, None)
    assert response['statusCode'] == 404

def test_lambda_handler_exists():
    assert callable(lambda_handler)

def test_cors_headers():
    event = make_event('GET', '/health')
    response = lambda_handler(event, None)
    assert 'Access-Control-Allow-Origin' in response['headers']
import os
import time
from decimal import Decimal

import boto3


def to_decimal(value):
    # Keep exact decimal strings instead of float imprecision.
    return Decimal(str(value))


def product_image_svg(title, accent):
    title = str(title).replace("&", "and")
    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="{accent}" stop-opacity="0.95"/>
          <stop offset="1" stop-color="#05050f" stop-opacity="1"/>
        </linearGradient>
        <radialGradient id="r" cx="40%" cy="30%" r="70%">
          <stop offset="0" stop-color="#a78bfa" stop-opacity="0.65"/>
          <stop offset="1" stop-color="{accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="300" fill="url(#g)"/>
      <rect width="800" height="300" fill="url(#r)"/>
      <circle cx="640" cy="70" r="90" fill="{accent}" fill-opacity="0.10"/>
      <circle cx="140" cy="220" r="110" fill="#22d3ee" fill-opacity="0.08"/>
      {''.join(
          f'<circle cx="{70+i*39}" cy="{40+((i*53)%180)}" r="{1+(i%3)}" fill="#ffffff" fill-opacity="{0.25+(i%5)*0.12}"/>'
          for i in range(18)
      )}
      <text x="34" y="168" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="30" font-weight="900" fill="rgba(255,255,255,0.92)">{title}</text>
      <text x="36" y="206" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" font-size="14" font-weight="700" fill="rgba(255,255,255,0.65)">OrbitStore // Tech Artifact</text>
    </svg>
    """.strip()

    # Minimal encoding for use as <img src="...">
    import urllib.parse

    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg)


def main():
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    products_table_name = os.environ.get("PRODUCTS_TABLE_NAME", "orbitstore-products")

    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table(products_table_name)

    products = [
        {
            "productId": "OS-NEBULA-CORE",
            "name": "Nebula Quantum Charger",
            "description": "Charged-vortex power cell for instant field re-activation.",
            "price": to_decimal(129.99),
            "currency": "USD",
            "image": product_image_svg("Nebula", "#a78bfa"),
            "category": "Energy",
            "tags": ["quantum", "charger", "neon"],
        },
        {
            "productId": "OS-ANTIMATTER-MEM",
            "name": "Antimatter Memory Drive",
            "description": "Crystal-stable storage for time-locked knowledge fragments.",
            "price": to_decimal(549.25),
            "currency": "USD",
            "image": product_image_svg("Antimatter", "#a78bfa"),
            "category": "Memory",
            "tags": ["storage", "crystal", "time-locked"],
        },
        {
            "productId": "OS-ION-GLOW-SUIT",
            "name": "IonGlow Smart Suit",
            "description": "Adaptive insulation weave with reactive neon telemetry.",
            "price": to_decimal(349.0),
            "currency": "USD",
            "image": product_image_svg("IonGlow", "#7c3aed"),
            "category": "Wearables",
            "tags": ["smart-suit", "ion", "telemetry"],
        },
        {
            "productId": "OS-GRAVITYLENS-VR",
            "name": "GravityLens VR Headset",
            "description": "Sub-gravity spatial lensing for ultra-precise holographic depth.",
            "price": to_decimal(239.99),
            "currency": "USD",
            "image": product_image_svg("GravityLens", "#a78bfa"),
            "category": "Vision",
            "tags": ["vr", "lensing", "hologram"],
        },
        {
            "productId": "OS-PLASMAFORGE-3D",
            "name": "PlasmaForge 3D Printer",
            "description": "Neon-heat layer printer tuned for resilient orbit-grade parts.",
            "price": to_decimal(899.0),
            "currency": "USD",
            "image": product_image_svg("PlasmaForge", "#22d3ee"),
            "category": "Manufacturing",
            "tags": ["3d-printer", "plasma", "orbit-grade"],
        },
        {
            "productId": "OS-STARWEAVE-AR",
            "name": "StarWeave AR Navigation",
            "description": "Augmented wayfinding with starlight alignment markers.",
            "price": to_decimal(79.99),
            "currency": "USD",
            "image": product_image_svg("StarWeave", "#7c3aed"),
            "category": "Navigation",
            "tags": ["ar", "navigation", "starlight"],
        },
        {
            "productId": "OS-PHOTON-SHIELD",
            "name": "PhotonShield Anti-Phishing Token",
            "description": "Quantum handshake token that verifies identity at light speed.",
            "price": to_decimal(59.5),
            "currency": "USD",
            "image": product_image_svg("PhotonShield", "#7c3aed"),
            "category": "Security",
            "tags": ["anti-phishing", "token", "quantum"],
        },
        {
            "productId": "OS-ORBITPULSE-DRONE",
            "name": "OrbitPulse Drone Companion",
            "description": "Autonomous scan-and-escort drone with orbital drift correction.",
            "price": to_decimal(499.5),
            "currency": "USD",
            "image": product_image_svg("OrbitPulse", "#22d3ee"),
            "category": "Companion",
            "tags": ["drone", "scan", "escort"],
        },
    ]

    now = int(time.time())
    with table.batch_writer() as batch:
        for p in products:
            item = {
                **p,
                "updatedAt": now,
            }
            batch.put_item(Item=item)

    print(f"Seeded {len(products)} products into {products_table_name}")


if __name__ == "__main__":
    main()


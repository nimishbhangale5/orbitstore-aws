const API_URL = window.API_URL;

const CART_KEY = "orbitstore-cart-v1";

const productsGridEl = document.getElementById("products-grid");
const productsLoadingEl = document.getElementById("products-loading");

const cartCountEl = document.getElementById("cart-count");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartEmptyEl = document.getElementById("cart-empty");

const checkoutBtn = document.getElementById("checkout-btn");
const orderStatusEl = document.getElementById("order-status");

function formatMoney(value, currency = "USD") {
  const num = Number(value);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  const parsed = raw ? safeParseJSON(raw) : null;
  if (!parsed || typeof parsed !== "object") return { items: {} };
  if (!parsed.items || typeof parsed.items !== "object") return { items: {} };
  return parsed;
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

function productIdOf(product) {
  return product.productId ?? product.id ?? "";
}

function updateCartUI() {
  const itemsArr = Object.values(cart.items);
  const totalCount = itemsArr.reduce((sum, it) => sum + (it.quantity ?? 0), 0);

  cartCountEl.textContent = String(totalCount);

  if (itemsArr.length === 0) {
    if (cartEmptyEl) cartEmptyEl.style.display = "";
    if (cartItemsEl) cartItemsEl.innerHTML = "";
    if (cartTotalEl) cartTotalEl.textContent = formatMoney(0);
    if (orderStatusEl) orderStatusEl.textContent = "";
    return;
  }

  if (cartEmptyEl) cartEmptyEl.style.display = "none";
  if (cartItemsEl) cartItemsEl.innerHTML = "";

  const currency = itemsArr[0].currency ?? "USD";

  let total = 0;
  for (const item of itemsArr) {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.price ?? 0);
    total += qty * price;

    const li = document.createElement("li");
    li.className = "cart-item";

    const title = document.createElement("div");
    const name = item.name ?? "Unknown Artifact";
    title.innerHTML = `
      <p class="cart-item-title">${escapeHtml(name)}</p>
      <p class="cart-item-meta">${escapeHtml(item.productId)} • ${escapeHtml(
        formatMoney(price, currency)
      )}</p>
    `;

    const qtyWrap = document.createElement("div");
    qtyWrap.className = "cart-item-qty";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "add-to-cart";
    minusBtn.textContent = "-";
    minusBtn.style.padding = "6px 10px";
    minusBtn.style.width = "38px";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.step = "1";
    qtyInput.value = String(qty);

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "add-to-cart";
    plusBtn.textContent = "+";
    plusBtn.style.padding = "6px 10px";
    plusBtn.style.width = "38px";

    function setQty(nextQty) {
      const q = Math.max(1, Math.floor(Number(nextQty)));
      const pid = item.productId;
      cart.items[pid].quantity = q;
      saveCart(cart);
      updateCartUI();
    }

    minusBtn.addEventListener("click", () => setQty(qty - 1));
    plusBtn.addEventListener("click", () => setQty(qty + 1));
    qtyInput.addEventListener("change", (e) => setQty(e.target.value));

    qtyWrap.append(minusBtn, qtyInput, plusBtn);

    li.append(title, qtyWrap);
    cartItemsEl.appendChild(li);
  }

  if (cartTotalEl) cartTotalEl.textContent = formatMoney(total, currency);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addToCart(product) {
  const pid = productIdOf(product);
  if (!pid) return;

  const currency = product.currency ?? "USD";
  const price = Number(product.price ?? 0);

  if (!cart.items[pid]) {
    cart.items[pid] = {
      productId: pid,
      name: product.name ?? "Unknown Artifact",
      price,
      currency,
      quantity: 1,
      image: product.image ?? "",
    };
  } else {
    cart.items[pid].quantity = (cart.items[pid].quantity ?? 0) + 1;
  }

  saveCart(cart);
  updateCartUI();
}

function getSampleProducts() {
  return [
    {
      productId: "OS-NEBULA-CORE",
      name: "Nebula Quantum Charger",
      description: "Charged-vortex power cell for instant field re-activation.",
      price: 129.99,
      currency: "USD",
      image: sampleSvg("Nebula", "#a78bfa"),
    },
    {
      productId: "OS-ION-GLOW-SUIT",
      name: "IonGlow Smart Suit",
      description: "Adaptive insulation weave with reactive neon telemetry.",
      price: 349.0,
      currency: "USD",
      image: sampleSvg("IonGlow", "#7c3aed"),
    },
    {
      productId: "OS-ORBITPULSE-DRONE",
      name: "OrbitPulse Drone Companion",
      description: "Autonomous scan-and-escort drone with orbital drift correction.",
      price: 499.5,
      currency: "USD",
      image: sampleSvg("OrbitPulse", "#22d3ee"),
    },
    {
      productId: "OS-GRAVITYLENS-VR",
      name: "GravityLens VR Headset",
      description: "Sub-gravity spatial lensing for ultra-precise holographic depth.",
      price: 239.99,
      currency: "USD",
      image: sampleSvg("GravityLens", "#a78bfa"),
    },
    {
      productId: "OS-STARWEAVE-AR",
      name: "StarWeave AR Navigation",
      description: "Augmented wayfinding with starlight alignment markers.",
      price: 79.99,
      currency: "USD",
      image: sampleSvg("StarWeave", "#7c3aed"),
    },
    {
      productId: "OS-PLASMAFORGE-3D",
      name: "PlasmaForge 3D Printer",
      description: "Neon-heat layer printer tuned for resilient orbit-grade parts.",
      price: 899.0,
      currency: "USD",
      image: sampleSvg("PlasmaForge", "#22d3ee"),
    },
    {
      productId: "OS-ANTIMATTER-MEM",
      name: "Antimatter Memory Drive",
      description: "Crystal-stable storage for time-locked knowledge fragments.",
      price: 549.25,
      currency: "USD",
      image: sampleSvg("Antimatter", "#a78bfa"),
    },
    {
      productId: "OS-PHOTON-SHIELD",
      name: "PhotonShield Anti-Phishing Token",
      description: "Quantum handshake token that verifies identity at light speed.",
      price: 59.5,
      currency: "USD",
      image: sampleSvg("PhotonShield", "#7c3aed"),
    },
  ];
}

function sampleSvg(title, accent) {
  const safeTitle = String(title).replaceAll("&", "and");
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#05050f" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="r" cx="40%" cy="30%" r="70%">
        <stop offset="0" stop-color="#a78bfa" stop-opacity="0.65"/>
        <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="300" fill="url(#g)"/>
    <rect width="800" height="300" fill="url(#r)"/>
    <circle cx="640" cy="70" r="90" fill="${accent}" fill-opacity="0.10"/>
    <circle cx="140" cy="220" r="110" fill="#22d3ee" fill-opacity="0.08"/>
    ${Array.from({ length: 18 })
      .map((_, i) => {
        const x = 70 + i * 39;
        const y = 40 + ((i * 53) % 180);
        const r = 1 + (i % 3);
        const o = 0.25 + (i % 5) * 0.12;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="${o}"/>`;
      })
      .join("")}
    <text x="34" y="168" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="30" font-weight="900" fill="rgba(255,255,255,0.92)">${safeTitle}</text>
    <text x="36" y="206" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" font-size="14" font-weight="700" fill="rgba(255,255,255,0.65)">OrbitStore // Tech Artifact</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function renderProducts(products) {
  if (!Array.isArray(products)) products = [];

  if (productsLoadingEl) productsLoadingEl.style.display = "none";
  if (productsGridEl) productsGridEl.innerHTML = "";

  if (products.length === 0) {
    if (productsLoadingEl) productsLoadingEl.textContent = "No inventory found.";
    return;
  }

  for (const p of products) {
    const productId = productIdOf(p);
    const name = p.name ?? "Unnamed Artifact";
    const description = p.description ?? "";
    const price = p.price ?? 0;
    const currency = p.currency ?? "USD";
    const image = p.image ?? "";

    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("role", "listitem");

    card.innerHTML = `
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
      <h3 class="product-name">${escapeHtml(name)}</h3>
      <p class="product-desc">${escapeHtml(description)}</p>
      <div class="product-footer">
        <div class="price">${escapeHtml(formatMoney(price, currency))}</div>
        <button class="add-to-cart" type="button" data-product-id="${escapeHtml(productId)}">
          Add to cart
        </button>
      </div>
    `;

    const btn = card.querySelector("button[data-product-id]");
    btn.addEventListener("click", () => addToCart(p));

    productsGridEl.appendChild(card);
  }
}

async function fetchProducts() {
  if (!API_URL) return getSampleProducts();
  try {
    const res = await fetch(`${API_URL}/products`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const products = data.products ?? data.items ?? data;
    if (!Array.isArray(products) || products.length === 0) return getSampleProducts();
    return products;
  } catch {
    return getSampleProducts();
  }
}

async function placeOrder() {
  orderStatusEl.textContent = "";

  const itemsArr = Object.values(cart.items);
  if (itemsArr.length === 0) {
    orderStatusEl.textContent = "Cart is empty. Add a product first.";
    return;
  }

  const currency = itemsArr[0].currency ?? "USD";
  const payload = { items: itemsArr.map((it) => ({ ...it })), currency };

  if (!API_URL) {
    orderStatusEl.textContent = "API URL not configured. Order not placed.";
    return;
  }

  try {
    checkoutBtn.disabled = true;
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    orderStatusEl.textContent = `Order confirmed: ${escapeHtml(data.orderId ?? "UNKNOWN")} • Total: ${formatMoney(
      data.total ?? 0,
      currency
    )}`;

    cart = { items: {} };
    saveCart(cart);
    updateCartUI();
  } catch (e) {
    orderStatusEl.textContent = `Order failed: ${escapeHtml(e?.message ?? "Unknown error")}`;
  } finally {
    checkoutBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  updateCartUI();

  if (checkoutBtn) checkoutBtn.addEventListener("click", placeOrder);

  if (!productsGridEl) return;
  if (productsLoadingEl) productsLoadingEl.style.display = "";

  const products = await fetchProducts();
  renderProducts(products);
});


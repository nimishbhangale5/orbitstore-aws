const API_URL = window.API_URL;
const CART_KEY = "orbitstore-cart-v1";

// ── DOM ELEMENTS ──
const productsGridEl   = document.getElementById("products-grid");
const productsLoadingEl = document.getElementById("products-loading");
const cartCountEl      = document.getElementById("cart-count");
const cartItemsEl      = document.getElementById("cart-items");
const cartTotalEl      = document.getElementById("cart-total");
const cartEmptyEl      = document.getElementById("cart-empty");
const checkoutBtn      = document.getElementById("checkout-btn");
const orderStatusEl    = document.getElementById("order-status");

// ── COGNITO CONFIG — Replace with your values after creating User Pool ──
const COGNITO_CONFIG = {
  UserPoolId: 'us-east-1_XXXXXXXXX',  // Replace after Cognito setup
  ClientId:   'XXXXXXXXXXXXXXXXXX'     // Replace after Cognito setup
};

// ── STATE ──
let allProducts  = [];
let activeFilter = 'All';
let currentUser  = null;
let cart         = loadCart();

// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════

function formatMoney(value, currency = "USD") {
  const num = Number(value);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function safeParseJSON(text) {
  try { return JSON.parse(text); }
  catch { return null; }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productIdOf(product) {
  return product.productId ?? product.id ?? "";
}

function showToast(message, color = "#059669") {
  const toast = document.createElement("div");
  toast.className = "success-toast";
  toast.style.background = color;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ════════════════════════════════════════
// CART — LOAD & SAVE
// ════════════════════════════════════════

function loadCart() {
  const raw    = localStorage.getItem(CART_KEY);
  const parsed = raw ? safeParseJSON(raw) : null;
  if (!parsed || typeof parsed !== "object") return { items: {} };
  if (!parsed.items || typeof parsed.items !== "object") return { items: {} };
  return parsed;
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ════════════════════════════════════════
// CART — UI
// ════════════════════════════════════════

function updateCartUI() {
  const itemsArr  = Object.values(cart.items);
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
    const qty   = Number(item.quantity ?? 0);
    const price = Number(item.price ?? 0);
    total += qty * price;

    const li = document.createElement("li");
    li.className = "cart-item";

    const title = document.createElement("div");
    const name  = item.name ?? "Unknown Artifact";
    title.innerHTML = `
      <p class="cart-item-title">${escapeHtml(name)}</p>
      <p class="cart-item-meta">${escapeHtml(item.productId)} • ${escapeHtml(formatMoney(price, currency))}</p>
    `;

    const qtyWrap  = document.createElement("div");
    qtyWrap.className = "cart-item-qty";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "add-to-cart";
    minusBtn.textContent = "-";
    minusBtn.style.cssText = "padding:6px 10px;width:38px";

    const qtyInput = document.createElement("input");
    qtyInput.type  = "number";
    qtyInput.min   = "1";
    qtyInput.step  = "1";
    qtyInput.value = String(qty);

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "add-to-cart";
    plusBtn.textContent = "+";
    plusBtn.style.cssText = "padding:6px 10px;width:38px";

    function setQty(nextQty) {
      const q   = Math.max(1, Math.floor(Number(nextQty)));
      const pid = item.productId;
      cart.items[pid].quantity = q;
      saveCart(cart);
      updateCartUI();
    }

    minusBtn.addEventListener("click", () => setQty(qty - 1));
    plusBtn.addEventListener("click",  () => setQty(qty + 1));
    qtyInput.addEventListener("change", (e) => setQty(e.target.value));

    qtyWrap.append(minusBtn, qtyInput, plusBtn);
    li.append(title, qtyWrap);
    cartItemsEl.appendChild(li);
  }

  if (cartTotalEl) cartTotalEl.textContent = formatMoney(total, currency);
}

function addToCart(product) {
  const pid      = productIdOf(product);
  if (!pid) return;

  const currency = product.currency ?? "USD";
  const price    = Number(product.price ?? 0);

  if (!cart.items[pid]) {
    cart.items[pid] = {
      productId: pid,
      name:      product.name ?? "Unknown Artifact",
      price,
      currency,
      quantity:  1,
      image:     product.image ?? "",
    };
  } else {
    cart.items[pid].quantity = (cart.items[pid].quantity ?? 0) + 1;
  }

  saveCart(cart);
  updateCartUI();
  showToast(`✅ ${product.name} added to cart!`);
}

// ════════════════════════════════════════
// SEARCH & FILTER
// ════════════════════════════════════════

function filterProducts() {
  const query = document.getElementById('search-input')?.value.toLowerCase() ?? '';
  const filtered = allProducts.filter(p => {
    const matchSearch = (p.name ?? '').toLowerCase().includes(query) ||
                        (p.description ?? '').toLowerCase().includes(query);
    const matchFilter = activeFilter === 'All' || p.category === activeFilter;
    return matchSearch && matchFilter;
  });
  renderProducts(filtered);
}

function setFilter(category, btn) {
  activeFilter = category;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterProducts();
}

// ════════════════════════════════════════
// PRODUCTS — FETCH & RENDER
// ════════════════════════════════════════

function getSampleProducts() {
  return [
    { productId: "OS-NEBULA-CORE",     name: "Nebula Quantum Charger",       category: "Power",         description: "Charged-vortex power cell for instant field re-activation.",              price: 129.99, currency: "USD", image: sampleSvg("Nebula",       "#a78bfa") },
    { productId: "OS-ION-GLOW-SUIT",   name: "IonGlow Smart Suit",           category: "Wearables",     description: "Adaptive insulation weave with reactive neon telemetry.",                price: 349.00, currency: "USD", image: sampleSvg("IonGlow",      "#7c3aed") },
    { productId: "OS-ORBITPULSE-DRONE",name: "OrbitPulse Drone Companion",   category: "Drones",        description: "Autonomous scan-and-escort drone with orbital drift correction.",         price: 499.50, currency: "USD", image: sampleSvg("OrbitPulse",   "#22d3ee") },
    { productId: "OS-GRAVITYLENS-VR",  name: "GravityLens VR Headset",       category: "Computing",     description: "Sub-gravity spatial lensing for ultra-precise holographic depth.",        price: 239.99, currency: "USD", image: sampleSvg("GravityLens",  "#a78bfa") },
    { productId: "OS-STARWEAVE-AR",    name: "StarWeave AR Navigation",      category: "Exploration",   description: "Augmented wayfinding with starlight alignment markers.",                  price: 79.99,  currency: "USD", image: sampleSvg("StarWeave",    "#7c3aed") },
    { productId: "OS-PLASMAFORGE-3D",  name: "PlasmaForge 3D Printer",       category: "Computing",     description: "Neon-heat layer printer tuned for resilient orbit-grade parts.",          price: 899.00, currency: "USD", image: sampleSvg("PlasmaForge",  "#22d3ee") },
    { productId: "OS-ANTIMATTER-MEM",  name: "Antimatter Memory Drive",      category: "Communication", description: "Crystal-stable storage for time-locked knowledge fragments.",             price: 549.25, currency: "USD", image: sampleSvg("Antimatter",   "#a78bfa") },
    { productId: "OS-PHOTON-SHIELD",   name: "PhotonShield Anti-Phishing",   category: "Wearables",     description: "Quantum handshake token that verifies identity at light speed.",         price: 59.50,  currency: "USD", image: sampleSvg("PhotonShield", "#7c3aed") },
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
    ${Array.from({ length: 18 }).map((_, i) => {
      const x = 70 + i * 39;
      const y = 40 + ((i * 53) % 180);
      const r = 1 + (i % 3);
      const o = 0.25 + (i % 5) * 0.12;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="${o}"/>`;
    }).join("")}
    <text x="34" y="168" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto" font-size="30" font-weight="900" fill="rgba(255,255,255,0.92)">${safeTitle}</text>
    <text x="36" y="206" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas" font-size="14" font-weight="700" fill="rgba(255,255,255,0.65)">OrbitStore // Tech Artifact</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function renderProducts(products) {
  if (!Array.isArray(products)) products = [];
  if (productsLoadingEl) productsLoadingEl.style.display = "none";
  if (productsGridEl)    productsGridEl.innerHTML = "";

  if (products.length === 0) {
    if (productsGridEl) productsGridEl.innerHTML = '<p class="no-results">🔍 No products found. Try a different search!</p>';
    return;
  }

  for (const p of products) {
    const productId   = productIdOf(p);
    const name        = p.name ?? "Unnamed Artifact";
    const description = p.description ?? "";
    const price       = p.price ?? 0;
    const currency    = p.currency ?? "USD";
    const image       = p.image ?? "";
    const category    = p.category ?? "";

    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("role", "listitem");

    card.innerHTML = `
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
      <div class="product-badge">${escapeHtml(category)}</div>
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

// ════════════════════════════════════════
// CHECKOUT MODAL
// ════════════════════════════════════════

function showCheckout() {
  const itemsArr = Object.values(cart.items);
  if (itemsArr.length === 0) {
    showToast("Your cart is empty!", "#ef4444");
    return;
  }
  const total    = itemsArr.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
  const currency = itemsArr[0].currency ?? "USD";

  document.getElementById('checkout-total').textContent = formatMoney(total, currency);
  document.getElementById('checkout-items').innerHTML   = itemsArr.map(it =>
    `<div style="display:flex;justify-content:space-between;padding:0.3rem 0;color:#9ca3af">
      <span>${escapeHtml(it.name)} × ${it.quantity}</span>
      <span>${formatMoney(Number(it.price) * Number(it.quantity), currency)}</span>
    </div>`
  ).join('');

  document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() {
  document.getElementById('checkout-modal').style.display = 'none';
}

async function placeOrder() {
  const name    = document.getElementById('checkout-name').value.trim();
  const email   = document.getElementById('checkout-email').value.trim();
  const address = document.getElementById('checkout-address').value.trim();

  if (!name || !email || !address) {
    showToast("Please fill in all fields!", "#ef4444");
    return;
  }

  const itemsArr = Object.values(cart.items);
  const currency = itemsArr[0]?.currency ?? "USD";
  const total    = itemsArr.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);

  const order = {
    orderId:   `ORD-${Date.now()}`,
    customer:  { name, email, address },
    items:     itemsArr,
    total,
    currency,
    status:    'confirmed',
    createdAt: new Date().toISOString()
  };

  if (API_URL) {
    try {
      await fetch(`${API_URL}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(order)
      });
    } catch (e) {
      console.warn('Order API failed, saved locally:', e);
    }
  }

  // Save for tracking
  localStorage.setItem('lastOrderId',    order.orderId);
  localStorage.setItem('lastOrderEmail', email);

  // Pre-fill tracking input
  const trackInput = document.getElementById('tracking-input');
  if (trackInput) trackInput.value = order.orderId;

  // Clear cart
  cart = { items: {} };
  saveCart(cart);
  updateCartUI();
  closeCheckout();

  showToast(`✅ Order ${order.orderId} placed! Check your email at ${email}`);
}

// ════════════════════════════════════════
// ORDER TRACKING
// ════════════════════════════════════════

async function trackOrder() {
  const orderId = document.getElementById('tracking-input')?.value.trim();
  const result  = document.getElementById('tracking-result');
  if (!result) return;

  if (!orderId) {
    result.innerHTML = '<p style="color:#ef4444;text-align:center">Please enter an Order ID</p>';
    return;
  }

  result.innerHTML = '<p class="loading">🔍 Searching for your order...</p>';

  const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
  const steps    = [
    { icon: '✅', label: 'Confirmed'  },
    { icon: '⚙️', label: 'Processing' },
    { icon: '🚀', label: 'Shipped'    },
    { icon: '📦', label: 'Delivered'  }
  ];

  let order = null;

  // Try API
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`);
      if (res.ok) order = await res.json();
    } catch {}
  }

  // Mock for demo if starts with ORD-
  if (!order && orderId.startsWith('ORD-')) {
    order = {
      orderId,
      status:    'shipped',
      customer:  { name: currentUser?.name ?? 'Explorer' },
      total:     299.99,
      currency:  'USD',
      createdAt: new Date().toISOString()
    };
  }

  if (!order) {
    result.innerHTML = '<p style="color:#ef4444;text-align:center">❌ Order not found. Please check your Order ID.</p>';
    return;
  }

  const currentStep = statuses.indexOf(order.status);

  result.innerHTML = `
    <div class="tracking-card">
      <h3>Order #${escapeHtml(order.orderId)}</h3>
      <p style="color:#9ca3af;margin-top:0.3rem">
        Placed: ${new Date(order.createdAt).toLocaleDateString()}
      </p>
      <p style="color:#818cf8;font-size:1.1rem;margin-top:0.5rem;font-weight:700">
        Total: ${formatMoney(order.total, order.currency ?? 'USD')}
      </p>
      <div class="tracking-steps">
        ${steps.map((step, i) => `
          <div class="tracking-step ${i <= currentStep ? 'done' : ''}">
            <div class="step-icon">${step.icon}</div>
            <p>${step.label}</p>
          </div>
        `).join('')}
      </div>
      <p style="text-align:center;color:#a78bfa;font-weight:600;margin-top:1rem">
        Current Status: ${escapeHtml(order.status.toUpperCase())} 🛸
      </p>
    </div>
  `;
}

// ════════════════════════════════════════
// AUTH — AWS COGNITO
// ════════════════════════════════════════

function openAuth() {
  document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuth() {
  document.getElementById('auth-modal').style.display = 'none';
}

function switchTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('auth-title').textContent    = tab === 'login'  ? '🔐 Sign In' : '🛸 Sign Up';
  document.getElementById('auth-message').innerHTML    = '';
}

function signUp() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const msg      = document.getElementById('auth-message');

  if (!name || !email || !password) {
    msg.innerHTML = '<span style="color:#ef4444">❌ Please fill in all fields</span>';
    return;
  }

  // Skip Cognito if not configured — show success for demo
  if (COGNITO_CONFIG.UserPoolId.includes('XXXXX')) {
    msg.innerHTML = '<span style="color:#059669">✅ Account created! (Demo mode — configure Cognito to enable real auth)</span>';
    return;
  }

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(COGNITO_CONFIG);
  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name',  Value: name  }),
    new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }),
  ];

  userPool.signUp(email, password, attributeList, null, (err, result) => {
    if (err) {
      msg.innerHTML = `<span style="color:#ef4444">❌ ${escapeHtml(err.message)}</span>`;
      return;
    }
    msg.innerHTML = '<span style="color:#059669">✅ Account created! Check your email to verify.</span>';
  });
}

function signIn() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const msg      = document.getElementById('auth-message');

  if (!email || !password) {
    msg.innerHTML = '<span style="color:#ef4444">❌ Please fill in all fields</span>';
    return;
  }

  // Demo mode if Cognito not configured
  if (COGNITO_CONFIG.UserPoolId.includes('XXXXX')) {
    currentUser = { email, name: email.split('@')[0] };
    msg.innerHTML = '<span style="color:#059669">✅ Welcome back! (Demo mode)</span>';
    updateNavForUser();
    setTimeout(closeAuth, 1500);
    return;
  }

  const userPool    = new AmazonCognitoIdentity.CognitoUserPool(COGNITO_CONFIG);
  const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({ Username: email, Password: password });
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });

  cognitoUser.authenticateUser(authDetails, {
    onSuccess: () => {
      currentUser = { email, name: email.split('@')[0] };
      msg.innerHTML = '<span style="color:#059669">✅ Welcome back!</span>';
      updateNavForUser();
      setTimeout(closeAuth, 1500);
    },
    onFailure: (err) => {
      msg.innerHTML = `<span style="color:#ef4444">❌ ${escapeHtml(err.message)}</span>`;
    }
  });
}

function updateNavForUser() {
  const loginBtn = document.querySelector('.nav-login-btn');
  if (loginBtn && currentUser) {
    loginBtn.textContent = `👤 ${currentUser.name}`;
    loginBtn.style.color = '#a78bfa';
  }
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  updateCartUI();

  // Checkout button in cart section
  if (checkoutBtn) checkoutBtn.addEventListener("click", showCheckout);

  // Pre-fill last order ID in tracking
  const lastOrderId = localStorage.getItem('lastOrderId');
  const trackInput  = document.getElementById('tracking-input');
  if (lastOrderId && trackInput) trackInput.value = lastOrderId;

  // Load products
  if (!productsGridEl) return;
  if (productsLoadingEl) productsLoadingEl.style.display = "";

  allProducts = await fetchProducts();
  renderProducts(allProducts);
});
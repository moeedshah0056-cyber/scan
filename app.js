/**
 * TapScan.pk - Complete Client Application Logic
 * Upgraded Frontend: Mobile-First, Accessible, Professional Icons & WhatsApp Ordering
 * Server-Safe (Universal Browser + Node.js / SSR compatibility)
 */

(function () {
  'use strict';

  // Universal environment & safe global scope (prevents ReferenceError during SSR / Node execution)
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
  if (typeof window === 'undefined') {
    globalScope.window = globalScope;
  }

  // Safe Icons fallback for Node/SSR environments
  const Icons = globalScope.Icons || (typeof require !== 'undefined' ? (function () {
    try { return require('./icons.js'); } catch (e) { return {}; }
  })() : {});

  // Safe localStorage access helpers (client-only lifecycle with try/catch fallback)
  function getSafeStorage(key, defaultValue) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn(`[TapScan] Error reading '${key}' from localStorage:`, e);
        return defaultValue;
      }
    }
    return defaultValue;
  }

  function setSafeStorage(key, value) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`[TapScan] Error writing '${key}' to localStorage:`, e);
      }
    }
  }

  // Server-safe default state (no browser APIs executed during module initialization)
  const state = {
    products: [],
    categories: [],
    cart: [],
    wishlist: [],
    activeCategory: 'all',
    searchQuery: '',
    sortBy: 'featured',
    discountPercent: 0,
    appliedCoupon: '',
    selectedPaymentMethod: 'cod'
  };

  // Dedicated WhatsApp Ordering Destination
  const WHATSAPP_NUMBER = '923213010900';
  const WHATSAPP_BASE_URL = 'https://wa.me/' + WHATSAPP_NUMBER;

  // Helper functions
  function formatPKR(amount) {
    return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
  }

  function saveCart() {
    setSafeStorage('tapscan_cart', state.cart);
    if (typeof document !== 'undefined') {
      updateCartUI();
    }
  }

  function saveWishlist() {
    setSafeStorage('tapscan_wishlist', state.wishlist);
    if (typeof document !== 'undefined') {
      updateWishlistUI();
    }
  }

  function showToast(message, iconSvg = null) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    const icon = iconSvg || (Icons.checkCircle ? Icons.checkCircle('toast-icon') : '');
    toast.innerHTML = `<span class="toast-icon-wrap">${icon}</span> <span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.96)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Cart Operations
  window.addToCart = function (productId, qty = 1) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        handle: product.handle,
        qty: qty
      });
    }

    saveCart();
    showToast(`Added "${product.title.slice(0, 24)}..." to cart`, Icons.checkCircle ? Icons.checkCircle() : null);
    openCartDrawer();
  };

  window.removeFromCart = function (productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    showToast('Item removed from cart', Icons.trash ? Icons.trash() : null);
  };

  window.updateQty = function (productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
    }
  };

  window.toggleWishlist = function (productId) {
    const idx = state.wishlist.indexOf(productId);
    if (idx === -1) {
      state.wishlist.push(productId);
      showToast('Added to wishlist', Icons.heartFilled ? Icons.heartFilled() : null);
    } else {
      state.wishlist.splice(idx, 1);
      showToast('Removed from wishlist', Icons.heart ? Icons.heart() : null);
    }
    saveWishlist();
  };

  function updateWishlistUI() {
    if (typeof document === 'undefined') return;
    const countEl = document.getElementById('wishlistCount');
    if (countEl) countEl.textContent = state.wishlist.length;
  }

  function updateCartUI() {
    if (typeof document === 'undefined') return;
    const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = (subtotal * state.discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discount);

    // Update Header & Mobile Bottom Bar
    const cartCountEl = document.getElementById('headerCartCount');
    const cartPriceEl = document.getElementById('headerCartPrice');
    const bottomCartEl = document.getElementById('bottomCartBadge');
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartPriceEl) cartPriceEl.textContent = formatPKR(finalTotal);
    if (bottomCartEl) bottomCartEl.textContent = totalQty;

    // Update Drawer Elements
    const drawerCountEl = document.getElementById('drawerCartCount');
    const drawerItemsEl = document.getElementById('drawerCartItems');
    const drawerSubtotalEl = document.getElementById('drawerSubtotal');
    const freeShippingBar = document.getElementById('freeShippingBar');
    const freeShippingMsg = document.getElementById('freeShippingMsg');

    if (drawerCountEl) drawerCountEl.textContent = totalQty;
    if (drawerSubtotalEl) drawerSubtotalEl.textContent = formatPKR(finalTotal);

    // Free delivery progress
    const threshold = window.TAPSCAN?.store?.freeDeliveryThreshold || 5000;
    if (freeShippingBar && freeShippingMsg) {
      if (subtotal >= threshold && subtotal > 0) {
        freeShippingBar.style.width = '100%';
        freeShippingMsg.innerHTML = `<span class="progress-unlocked-icon">${Icons.sparkles ? Icons.sparkles() : ''}</span> <strong>Free Delivery Unlocked!</strong> You qualify for free nationwide delivery.`;
      } else {
        const remaining = threshold - subtotal;
        const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
        freeShippingBar.style.width = pct + '%';
        freeShippingMsg.innerHTML = `Add <strong>${formatPKR(remaining)}</strong> more to unlock <strong>Free Delivery</strong>!`;
      }
    }

    // Render items in drawer
    if (drawerItemsEl) {
      if (state.cart.length === 0) {
        drawerItemsEl.innerHTML = `
          <div class="cart-empty-state">
            <div class="cart-empty-icon">${Icons.shoppingBag ? Icons.shoppingBag('icon-hero-empty') : ''}</div>
            <h4>Your cart is empty</h4>
            <p>Looks like you haven't added any smart NFC stands yet.</p>
            <button class="btn-primary" style="margin-top: 1.25rem; width: 100%;" onclick="closeCartDrawer(); window.location.hash='#shop';">
              ${Icons.shoppingBag ? Icons.shoppingBag() : ''} Shop All Stands
            </button>
          </div>
        `;
      } else {
        drawerItemsEl.innerHTML = state.cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" loading="lazy" />
            <div class="cart-item-info">
              <h4 class="cart-item-title">${item.title}</h4>
              <div class="cart-item-price">${formatPKR(item.price)}</div>
              <div class="qty-control" aria-label="Quantity for ${item.title}">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)" aria-label="Decrease quantity">
                  ${Icons.minus ? Icons.minus() : '−'}
                </button>
                <span class="qty-number">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)" aria-label="Increase quantity">
                  ${Icons.plus ? Icons.plus() : '+'}
                </button>
              </div>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="Remove item" aria-label="Remove ${item.title}">
              ${Icons.trash ? Icons.trash() : ''}
            </button>
          </div>
        `).join('');
      }
    }
  }

  // Drawer Controls
  window.openCartDrawer = function () {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeCartDrawer = function () {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Coupon
  window.applyCoupon = function () {
    const input = document.getElementById('couponCodeInput');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === 'TAPUP10' || code === 'TAPSCAN10' || code === 'SAVE10') {
      state.discountPercent = 10;
      state.appliedCoupon = code;
      showToast('Promo code applied: 10% Discount!', Icons.tag ? Icons.tag() : null);
      updateCartUI();
    } else if (code === 'FREESHIP') {
      showToast('Free shipping promo applied!', Icons.truck ? Icons.truck() : null);
    } else {
      showToast('Invalid promo code. Try "TAPUP10"', Icons.alertCircle ? Icons.alertCircle() : null);
    }
  };

  // WhatsApp Order Generator
  // Destination: +92 321 3010900 (URL: https://wa.me/923213010900)
  window.orderOnWhatsApp = function (productId = null, customQty = 1) {
    let message = '';

    if (productId) {
      const p = state.products.find(item => item.id === productId);
      if (p) {
        const qty = Math.max(1, customQty);
        message = [
          `Hello! I would like to order:`,
          `• *Product:* ${p.title}`,
          `• *Quantity:* ${qty}`,
          `• *Unit Price:* ${formatPKR(p.price)}`,
          `• *Total:* ${formatPKR(p.price * qty)}`,
          `• *Product Link:* https://tapup.pk/#product/${p.id}`,
          ``,
          `Please confirm availability and share customization details for our logo & links.`
        ].join('\n');
      }
    } else if (state.cart.length > 0) {
      const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
      const discount = (subtotal * state.discountPercent) / 100;
      const threshold = window.TAPSCAN?.store?.freeDeliveryThreshold || 5000;
      const shipping = subtotal >= threshold ? 0 : 250;
      const grandTotal = Math.max(0, subtotal - discount) + shipping;

      const itemsList = state.cart.map((i, idx) =>
        `${idx + 1}. *${i.title}*\n   Qty: ${i.qty} | Price: ${formatPKR(i.price)} | Subtotal: ${formatPKR(i.price * i.qty)}`
      ).join('\n\n');

      message = [
        `Hello! I would like to place an order from my cart:`,
        ``,
        itemsList,
        ``,
        `─────────────────────`,
        `*Items Subtotal:* ${formatPKR(subtotal)}`,
        state.discountPercent > 0 ? `*Discount (${state.appliedCoupon}):* -${formatPKR(discount)}` : null,
        `*Delivery Charges:* ${shipping === 0 ? 'FREE (Unlocked)' : formatPKR(shipping)}`,
        `*Payable Grand Total:* ${formatPKR(grandTotal)}`,
        `*Payment Method:* Cash on Delivery (COD)`,
        `─────────────────────`,
        `Please confirm my order and share customization instructions for our logo & links.`
      ].filter(Boolean).join('\n');
    } else {
      message = `Hello! I would like to place an order. Please share the available products and ordering details.`;
    }

    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Quick inquiry message trigger for WhatsApp
  window.quickWaMessage = function (msg) {
    const text = msg || `Hello! I would like to inquire about TapScan smart NFC & QR stands for my business.`;
    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Checkout Modal
  window.openCheckout = function () {
    if (state.cart.length === 0) {
      showToast('Your cart is empty! Add products to proceed.', Icons.alertCircle ? Icons.alertCircle() : null);
      return;
    }
    closeCartDrawer();
    const overlay = document.getElementById('checkoutModalOverlay');
    if (!overlay) return;

    // populate summary
    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const discount = (subtotal * state.discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discount);
    const shipping = subtotal >= (window.TAPSCAN?.store?.freeDeliveryThreshold || 5000) ? 0 : 250;

    const summaryEl = document.getElementById('checkoutSummaryContent');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="summary-row">
          <span>Subtotal (${state.cart.reduce((s, i) => s + i.qty, 0)} items)</span>
          <span>${formatPKR(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="summary-row" style="color: var(--emerald);">
          <span>Promo Discount (${state.appliedCoupon})</span>
          <span>−${formatPKR(discount)}</span>
        </div>` : ''}
        <div class="summary-row">
          <span>Delivery Charges (Pakistan)</span>
          <span>${shipping === 0 ? '<strong style="color:var(--emerald);">FREE</strong>' : formatPKR(shipping)}</span>
        </div>
        <div class="summary-row total">
          <span>Payable Total:</span>
          <span>${formatPKR(finalTotal + shipping)}</span>
        </div>
      `;
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeCheckout = function () {
    const overlay = document.getElementById('checkoutModalOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  window.selectPaymentMethod = function (method) {
    state.selectedPaymentMethod = method;
    document.querySelectorAll('.payment-opt-card').forEach(c => c.classList.remove('active'));
    const clicked = document.querySelector(`.payment-opt-card[data-method="${method}"]`);
    if (clicked) clicked.classList.add('active');

    const detailBox = document.getElementById('paymentMethodDetails');
    if (!detailBox) return;

    if (method === 'cod') {
      detailBox.innerHTML = `<strong>Cash on Delivery (COD):</strong> Pay in cash to the courier rider upon delivery anywhere in Pakistan.`;
    } else if (method === 'jazzcash') {
      detailBox.innerHTML = `<strong>EasyPaisa / JazzCash:</strong> Send total amount to <strong>0321-3010900</strong> (Title: TapScan PK). Please send transaction screenshot on WhatsApp (+92 321 3010900) after placing order.`;
    } else if (method === 'bank') {
      detailBox.innerHTML = `<strong>Direct Bank Transfer:</strong> Bank: Meezan Bank Ltd. | Account Title: TapScan PK | IBAN: PK45MEZN0002190105829102. Share deposit receipt on WhatsApp (+92 321 3010900).`;
    }
  };

  window.handleCheckoutSubmit = function (e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const city = document.getElementById('custCity').value;
    const address = document.getElementById('custAddress').value.trim();
    const notes = document.getElementById('custNotes').value.trim();
    const payment = state.selectedPaymentMethod || 'cod';

    if (!name || !phone || !address || !city) {
      showToast('Please fill all required fields.', Icons.alertCircle ? Icons.alertCircle() : null);
      return;
    }

    const orderId = 'TU-' + Math.floor(100000 + Math.random() * 900000);
    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const shipping = subtotal >= 5000 ? 0 : 250;
    const discount = (subtotal * state.discountPercent) / 100;
    const grandTotal = subtotal - discount + shipping;

    // Show Success View
    const modalBody = document.querySelector('.checkout-modal-body');
    const itemsText = state.cart.map(i => `• ${i.title} x ${i.qty} (${formatPKR(i.price * i.qty)})`).join('\n');

    const waOrderMsg = [
      `Assalam o Alaikum TapUp PK!`,
      ``,
      `New Order Confirmed!`,
      `*Order ID:* #${orderId}`,
      `*Customer:* ${name}`,
      `*Phone:* ${phone}`,
      `*City:* ${city}`,
      `*Address:* ${address}`,
      `*Payment Method:* ${payment.toUpperCase()}`,
      ``,
      `*Ordered Items:*`,
      itemsText,
      ``,
      `*Grand Total:* ${formatPKR(grandTotal)}`,
      notes ? `*Special Notes:* ${notes}` : null,
      ``,
      `Please confirm my standee fabrication!`
    ].filter(Boolean).join('\n');

    modalBody.innerHTML = `
      <div class="order-success-card">
        <div class="success-icon">${Icons.checkCircle ? Icons.checkCircle('icon-hero-check') : ''}</div>
        <h2>Thank You, ${name}!</h2>
        <p>Your order has been recorded successfully. Our Lahore production team will verify your customization details shortly.</p>
        <div class="order-id-badge">Order ID: #${orderId}</div>
        <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
          We will contact you on <strong>${phone}</strong> for your business logo and destination link configurations.
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a href="${WHATSAPP_BASE_URL}?text=${encodeURIComponent(waOrderMsg)}" target="_blank" class="btn-whatsapp" style="width: 100%;">
            ${Icons.whatsapp ? Icons.whatsapp() : ''} Send Order Details to WhatsApp
          </a>
          <button class="btn-secondary" onclick="closeCheckout(); window.location.hash='#home';">
            Continue Shopping
          </button>
        </div>
      </div>
    `;

    // Clear cart
    state.cart = [];
    state.discountPercent = 0;
    saveCart();
  };

  // Quick View Modal
  window.openQuickView = function (productId) {
    const p = state.products.find(item => item.id === productId);
    if (!p) return;

    const overlay = document.getElementById('quickViewOverlay');
    const content = document.getElementById('quickViewContent');
    if (!overlay || !content) return;

    content.innerHTML = `
      <div class="qv-media-col">
        <img src="${p.images[0]}" alt="${p.title}" class="qv-main-img" id="qvMainImage" />
        ${p.images.length > 1 ? `
          <div class="qv-thumbs-row">
            ${p.images.map((img, idx) => `
              <img src="${img}" alt="${p.title} view ${idx + 1}" class="qv-thumb ${idx === 0 ? 'active' : ''}" onclick="document.getElementById('qvMainImage').src='${img}'; document.querySelectorAll('.qv-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');" />
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="qv-details-col">
        <div class="qv-tag">${p.product_type || 'Smart QR Standee'}</div>
        <h2 class="qv-title">${p.title}</h2>
        <div class="qv-price-row">
          <div class="qv-price">${formatPKR(p.price)}</div>
          ${p.compare_at_price ? `<div class="qv-compare">${formatPKR(p.compare_at_price)}</div>` : ''}
          ${p.badge ? `<span class="product-tag-badge" style="position:static;">${p.badge}</span>` : ''}
        </div>
        <div class="qv-desc">
          ${p.description || 'Custom laser-cut acrylic standee equipped with high-frequency NFC chip and dynamic QR codes. Built for cafés, restaurants, salons, clinics, and modern businesses.'}
        </div>
        <ul class="qv-features-list">
          <li><span class="check-icon">${Icons.check ? Icons.check() : ''}</span> 100% Plug &amp; Play — Ready out of the box</li>
          <li><span class="check-icon">${Icons.check ? Icons.check() : ''}</span> Lifetime access — Zero monthly fees</li>
          <li><span class="check-icon">${Icons.check ? Icons.check() : ''}</span> Android &amp; iPhone universal compatibility</li>
          <li><span class="check-icon">${Icons.check ? Icons.check() : ''}</span> Personalized with your brand logo &amp; colors</li>
        </ul>
        <div class="qv-actions">
          <button class="btn-primary" style="flex:1;" onclick="addToCart(${p.id}); closeQuickView();">
            ${Icons.shoppingBag ? Icons.shoppingBag() : ''} Add to Cart
          </button>
          <button class="btn-whatsapp" onclick="orderOnWhatsApp(${p.id})">
            ${Icons.whatsapp ? Icons.whatsapp() : ''} Order on WhatsApp
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeQuickView = function () {
    const overlay = document.getElementById('quickViewOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Interactive Live NFC Simulator
  window.triggerNfcDemo = function () {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    }
    const overlay = document.getElementById('nfcTapOverlay');
    if (overlay) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeNfcDemo = function () {
    const overlay = document.getElementById('nfcTapOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  // Live Search Controls
  window.openSearch = function () {
    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.getElementById('searchInput')?.focus();
      }, 100);
    }
  };

  window.closeSearch = function () {
    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.handleSearchInput = function (val) {
    const query = val.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    if (!query) {
      resultsContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">Start typing to search products...</p>';
      return;
    }

    const matched = state.products.filter(p =>
      p.title.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    );

    if (matched.length === 0) {
      resultsContainer.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">No products found for "${val}".</p>`;
    } else {
      resultsContainer.innerHTML = matched.slice(0, 8).map(p => `
        <div class="search-item" onclick="closeSearch(); window.location.hash='#product/' + ${p.id};" role="button" tabindex="0">
          <img src="${p.images[0]}" alt="${p.title}" />
          <div class="search-item-info">
            <h4>${p.title}</h4>
            <p>${formatPKR(p.price)}</p>
          </div>
        </div>
      `).join('');
    }
  };

  // Floating WhatsApp Support
  window.toggleWaPopup = function () {
    const popup = document.getElementById('waChatPopup');
    if (popup) popup.classList.toggle('active');
  };

  // Rendering Product Card HTML
  function renderProductCard(p) {
    return `
      <div class="product-card" data-category="${p.category}">
        <div class="product-thumb-wrap" onclick="openQuickView(${p.id})">
          <img src="${p.images[0]}" alt="${p.title}" class="product-thumb" loading="lazy" />
          ${p.badge ? `<span class="product-tag-badge">${p.badge}</span>` : ''}
          <div class="quick-action-overlay">
            <button class="quick-btn" onclick="event.stopPropagation(); openQuickView(${p.id});" aria-label="Quick view ${p.title}">
              ${Icons.eye ? Icons.eye() : ''} Quick View
            </button>
            <button class="quick-btn" onclick="event.stopPropagation(); addToCart(${p.id});" aria-label="Add ${p.title} to cart">
              ${Icons.shoppingBag ? Icons.shoppingBag() : ''} Add to Cart
            </button>
          </div>
        </div>
        <div class="product-details">
          <h3 class="product-title">
            <a href="#product/${p.id}" title="${p.title}">${p.title}</a>
          </h3>
          <div class="product-price-row">
            <span class="current-price">${formatPKR(p.price)}</span>
            ${p.compare_at_price ? `<span class="compare-price">${formatPKR(p.compare_at_price)}</span>` : ''}
          </div>
          <div class="product-card-actions">
            <button class="btn-add-cart" onclick="addToCart(${p.id})" aria-label="Add ${p.title} to Cart">
              ${Icons.shoppingBag ? Icons.shoppingBag() : ''} Add to Cart
            </button>
            <button class="btn-wa-order" title="Order on WhatsApp" aria-label="Order ${p.title} on WhatsApp" onclick="orderOnWhatsApp(${p.id})">
              ${Icons.whatsapp ? Icons.whatsapp() : 'WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Filter and Sort Products
  function getFilteredProducts() {
    let list = [...state.products];
    if (state.activeCategory !== 'all') {
      list = list.filter(p => p.category === state.activeCategory);
    }
    if (state.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }

  window.setCategory = function (cat) {
    state.activeCategory = cat;
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });
    renderHomeProducts();
    renderCatalogProducts();
  };

  window.handleSortChange = function (val) {
    state.sortBy = val;
    renderHomeProducts();
    renderCatalogProducts();
  };

  function renderHomeProducts() {
    const grid = document.getElementById('homeProductsGrid');
    if (!grid) return;
    const items = getFilteredProducts().slice(0, 8);
    grid.innerHTML = items.map(renderProductCard).join('');
  }

  function renderCatalogProducts() {
    const grid = document.getElementById('catalogProductsGrid');
    if (!grid) return;
    const items = getFilteredProducts();
    grid.innerHTML = items.map(renderProductCard).join('');
    const countEl = document.getElementById('catalogProductCount');
    if (countEl) countEl.textContent = `${items.length} Products Available`;
  }

  // Router for Multi-Page View
  function handleRoute() {
    const hash = window.location.hash || '#home';
    const [route, param] = hash.split('/');

    // Hide all views
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === hash || (href === '#home' && (hash === '' || hash === '#home')));
    });

    // Update Mobile Bottom Bar active states
    const bHome = document.getElementById('bottomNavHome');
    const bShop = document.getElementById('bottomNavShop');
    if (bHome) bHome.classList.toggle('active', route === '#home' || !route || route === '');
    if (bShop) bShop.classList.toggle('active', route === '#shop' || route === '#collections' || route === '#product');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === '#shop' || route === '#collections') {
      const shopView = document.getElementById('viewShop');
      if (shopView) shopView.classList.add('active');
      if (param) setCategory(param);
      renderCatalogProducts();
    } else if (route === '#product') {
      renderProductDetailPage(parseInt(param, 10));
    } else if (route === '#reviews') {
      window.location.hash = '#shop';
      return;
    } else if (route === '#how-it-works') {
      document.getElementById('viewHowItWorks')?.classList.add('active');
    } else if (route === '#about') {
      document.getElementById('viewAbout')?.classList.add('active');
    } else if (route === '#faqs') {
      document.getElementById('viewFaqs')?.classList.add('active');
    } else if (route === '#contact') {
      document.getElementById('viewContact')?.classList.add('active');
    } else if (route === '#policy') {
      renderPolicyPage(param || 'privacy');
    } else {
      // Default: #home
      document.getElementById('viewHome')?.classList.add('active');
      renderHomeProducts();
    }
  }

  function renderProductDetailPage(productId) {
    const p = state.products.find(item => item.id === productId);
    const view = document.getElementById('viewProductDetail');
    if (!view || !p) {
      window.location.hash = '#shop';
      return;
    }

    view.classList.add('active');
    const container = document.getElementById('productDetailContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="container">
        <nav class="breadcrumb-nav" aria-label="Breadcrumbs">
          <a href="#home">Home</a> / <a href="#shop">Shop</a> / <span class="current">${p.title}</span>
        </nav>
        <div class="quick-view-modal product-detail-card">
          <div class="qv-media-col">
            <img src="${p.images[0]}" alt="${p.title}" class="qv-main-img detail-main-photo" id="detailMainImg" />
            <div class="qv-thumbs-row">
              ${p.images.map((img, i) => `
                <img src="${img}" alt="${p.title} photo ${i + 1}" class="qv-thumb ${i === 0 ? 'active' : ''}" onclick="document.getElementById('detailMainImg').src='${img}'; document.querySelectorAll('.qv-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');" />
              `).join('')}
            </div>
          </div>
          <div class="qv-details-col">
            <div class="qv-tag">${p.product_type}</div>
            <h1 class="detail-title">${p.title}</h1>
            <div class="qv-price-row" style="margin-bottom: 1.5rem;">
              <div class="qv-price" style="font-size: 2rem;">${formatPKR(p.price)}</div>
              ${p.compare_at_price ? `<div class="qv-compare" style="font-size: 1.25rem;">${formatPKR(p.compare_at_price)}</div>` : ''}
              ${p.badge ? `<span class="product-tag-badge" style="position:static;">${p.badge}</span>` : ''}
            </div>
            <div class="detail-trust-box">
              <div class="trust-line">${Icons.truck ? Icons.truck() : ''} <strong>Cash on Delivery (COD) Available</strong> across Pakistan.</div>
              <div class="trust-line">${Icons.zap ? Icons.zap() : ''} <strong>Delivery:</strong> 2–4 Business Days via Express Courier.</div>
              <div class="trust-line">${Icons.sparkles ? Icons.sparkles() : ''} <strong>Customization:</strong> We reach out on WhatsApp to collect your logo &amp; links.</div>
            </div>
            <div class="qv-desc" style="font-size: 0.95rem; margin-bottom: 2rem;">
              ${p.description || 'Elevate your customer engagement with TapScan custom NFC stands. Precision-crafted in Lahore, Pakistan with laser-cut acrylic and UV-resistant printing.'}
            </div>
            <div class="detail-action-row">
              <div class="qty-control detail-qty-stepper">
                <button class="qty-btn" aria-label="Decrease quantity" onclick="let el=document.getElementById('detailQty'); el.innerText=Math.max(1, parseInt(el.innerText)-1);">${Icons.minus ? Icons.minus() : '−'}</button>
                <span id="detailQty" class="qty-number">1</span>
                <button class="qty-btn" aria-label="Increase quantity" onclick="let el=document.getElementById('detailQty'); el.innerText=parseInt(el.innerText)+1;">${Icons.plus ? Icons.plus() : '+'}</button>
              </div>
              <button class="btn-primary detail-add-btn" onclick="addToCart(${p.id}, parseInt(document.getElementById('detailQty').innerText));">
                ${Icons.shoppingBag ? Icons.shoppingBag() : ''} Add to Cart
              </button>
              <button class="btn-whatsapp detail-wa-btn" onclick="orderOnWhatsApp(${p.id}, parseInt(document.getElementById('detailQty').innerText));">
                ${Icons.whatsapp ? Icons.whatsapp() : ''} Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPolicyPage(type) {
    const view = document.getElementById('viewPolicy');
    if (!view) return;
    view.classList.add('active');

    const policies = window.TAPSCAN?.policies || {};
    const titleMap = {
      privacy: 'Privacy Policy',
      refund: 'Refund & Return Policy',
      shipping: 'Shipping & Delivery Policy',
      terms: 'Terms of Service'
    };

    const paragraphs = policies[type] || ['Policy content will be updated shortly.'];
    const container = document.getElementById('policyContentContainer');
    if (container) {
      container.innerHTML = `
        <div class="page-header-banner">
          <h1>${titleMap[type] || 'Store Policy'}</h1>
          <p>Official store guidelines and transparency documentation for TapScan.pk.</p>
        </div>
        <div class="container">
          <div class="content-card">
            ${paragraphs.map(p => `<p>${p}</p>`).join('')}
          </div>
        </div>
      `;
    }
  }

  // FAQ Accordion Toggle
  window.toggleFaq = function (el) {
    const parent = el.closest('.faq-item');
    if (!parent) return;
    const isActive = parent.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!isActive) parent.classList.add('active');
  };

  // Mobile Menu Drawer
  window.toggleMobileNav = function () {
    const nav = document.getElementById('mobileNavDrawer');
    if (nav) {
      const isOpen = nav.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  };

  // Keyboard accessibility: ESC key closes modals
  function handleGlobalKeyDown(e) {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeCheckout();
      closeQuickView();
      closeNfcDemo();
      closeSearch();
      const mobileNav = document.getElementById('mobileNavDrawer');
      if (mobileNav && mobileNav.classList.contains('open')) {
        toggleMobileNav();
      }
      const waPopup = document.getElementById('waChatPopup');
      if (waPopup && waPopup.classList.contains('active')) {
        toggleWaPopup();
      }
    }
  }

  // Initialize
  function init() {
    // Client-side synchronization with localStorage
    state.cart = getSafeStorage('tapscan_cart', []);
    state.wishlist = getSafeStorage('tapscan_wishlist', []);

    if (typeof window !== 'undefined' && window.TAPSCAN) {
      state.products = window.TAPSCAN.products || [];
      state.categories = window.TAPSCAN.collections || [];
    }

    // Populate City dropdown
    const citySelect = document.getElementById('custCity');
    if (citySelect && window.TAPSCAN?.pakistanCities) {
      citySelect.innerHTML = '<option value="">Select your city...</option>' +
        window.TAPSCAN.pakistanCities.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate FAQs in home & faqs view
    const homeFaqList = document.getElementById('homeFaqList');
    if (homeFaqList && window.TAPSCAN?.faqs) {
      homeFaqList.innerHTML = window.TAPSCAN.faqs.slice(0, 8).map((faq, i) => `
        <div class="faq-item ${i === 0 ? 'active' : ''}">
          <button class="faq-question" onclick="toggleFaq(this)" aria-expanded="${i === 0}">
            <span>${faq.question}</span>
            <span class="faq-icon">${Icons.chevronDown ? Icons.chevronDown() : '+'}</span>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-inner">${faq.answer}</div>
          </div>
        </div>
      `).join('');
    }

    const fullFaqList = document.getElementById('fullFaqList');
    if (fullFaqList && window.TAPSCAN?.faqs) {
      fullFaqList.innerHTML = window.TAPSCAN.faqs.map((faq, i) => `
        <div class="faq-item ${i === 0 ? 'active' : ''}">
          <button class="faq-question" onclick="toggleFaq(this)" aria-expanded="${i === 0}">
            <span>${faq.question}</span>
            <span class="faq-icon">${Icons.chevronDown ? Icons.chevronDown() : '+'}</span>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-inner">${faq.answer}</div>
          </div>
        </div>
      `).join('');
    }


    // Populate Brands Marquee
    const brandsList = document.getElementById('brandsGrid');
    if (brandsList && window.TAPSCAN?.brands) {
      brandsList.innerHTML = window.TAPSCAN.brands.map(b => `
        <div class="brand-item" title="${b.name}">
          <img src="${b.logo}" alt="${b.name} logo" loading="lazy" />
        </div>
      `).join('');
    }

    // Setup router
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('hashchange', handleRoute);
      window.addEventListener('keydown', handleGlobalKeyDown);
      window.addEventListener('scroll', () => {
        const header = document.querySelector('.site-header');
        if (header) {
          header.classList.toggle('scrolled', window.scrollY > 20);
        }
      });
    }
    if (typeof window !== 'undefined' && window.location) {
      handleRoute();
    }

    updateCartUI();
    updateWishlistUI();
  }

  // Client-side DOM Content Loaded lifecycle
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Export for SSR / Node.js / Tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      state,
      init,
      getSafeStorage,
      setSafeStorage,
      formatPKR,
      orderOnWhatsApp: window.orderOnWhatsApp
    };
  }
})();

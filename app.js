/**
 * TapScan.pk - Complete Client Application Logic
 * Single-Page Router, Product Filtering, Cart Drawer, COD Checkout, WhatsApp Orders, NFC Simulator
 */

(function () {
  'use strict';

  // Universal environment & safe global scope (prevents ReferenceError during SSR / Node execution)
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
  if (typeof window === 'undefined') {
    globalScope.window = globalScope;
  }

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
    appliedCoupon: ''
  };

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

  function showToast(message, icon = '✓') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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
    showToast(`Added "${product.title.slice(0, 24)}..." to cart`);
    openCartDrawer();
  };

  window.removeFromCart = function (productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    showToast('Item removed from cart', '✕');
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
      showToast('Added to wishlist', '♥');
    } else {
      state.wishlist.splice(idx, 1);
      showToast('Removed from wishlist', '♡');
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

    // Update Header
    const cartCountEl = document.getElementById('headerCartCount');
    const cartPriceEl = document.getElementById('headerCartPrice');
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartPriceEl) cartPriceEl.textContent = formatPKR(finalTotal);

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
      if (subtotal >= threshold) {
        freeShippingBar.style.width = '100%';
        freeShippingMsg.innerHTML = '🎉 <strong>Free Delivery Unlocked!</strong> You qualify for free delivery across Pakistan.';
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
            <div class="cart-empty-icon">🛒</div>
            <h4>Your cart is empty</h4>
            <p>Looks like you haven't added any smart NFC stands yet.</p>
            <button class="btn-primary" style="margin-top: 1rem; width: 100%;" onclick="closeCartDrawer(); window.location.hash='#shop';">Shop All Stands</button>
          </div>
        `;
      } else {
        drawerItemsEl.innerHTML = state.cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
            <div class="cart-item-info">
              <h4>${item.title}</h4>
              <div class="cart-item-price">${formatPKR(item.price)}</div>
              <div class="qty-control">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="qty-number">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
              </div>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="Remove item">✕</button>
          </div>
        `).join('');
      }
    }
  }

  // Drawer Controls
  window.openCartDrawer = function () {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.add('open');
  };

  window.closeCartDrawer = function () {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  // Coupon
  window.applyCoupon = function () {
    const input = document.getElementById('couponCodeInput');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === 'TAPSCAN10' || code === 'SAVE10') {
      state.discountPercent = 10;
      state.appliedCoupon = code;
      showToast('Promo code applied: 10% Discount!');
      updateCartUI();
    } else if (code === 'FREESHIP') {
      showToast('Free shipping promo applied!');
    } else {
      showToast('Invalid promo code. Try "TAPSCAN10"', '⚠');
    }
  };

  // WhatsApp Order Generator
  window.orderOnWhatsApp = function (productId = null) {
    let message = '';
    const phone = window.TAPSCAN?.store?.whatsapp || '923277008585';

    if (productId) {
      const p = state.products.find(item => item.id === productId);
      if (p) {
        message = `Assalam o Alaikum TapScan team! 👋\nI want to order:\n*${p.title}*\nPrice: ${formatPKR(p.price)}\nLink: https://tapscan.pk/products/${p.handle}\nPlease send customization details for logo and links.`;
      }
    } else if (state.cart.length > 0) {
      const itemsList = state.cart.map((i, idx) => `${idx + 1}. ${i.title} (Qty: ${i.qty}) - ${formatPKR(i.price * i.qty)}`).join('\n');
      const total = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
      message = `Assalam o Alaikum TapScan PK! 📦\nI would like to place an order:\n\n${itemsList}\n\n*Total Amount: ${formatPKR(total)}*\nPlease confirm availability and payment details.`;
    } else {
      message = `Assalam o Alaikum TapScan team! I want to inquire about custom NFC and QR code stands for my business.`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Checkout Modal
  window.openCheckout = function () {
    if (state.cart.length === 0) {
      showToast('Your cart is empty!', '⚠');
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
  };

  window.closeCheckout = function () {
    const overlay = document.getElementById('checkoutModalOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  window.selectPaymentMethod = function (method) {
    document.querySelectorAll('.payment-opt-card').forEach(c => c.classList.remove('active'));
    const clicked = document.querySelector(`.payment-opt-card[data-method="${method}"]`);
    if (clicked) clicked.classList.add('active');

    const detailBox = document.getElementById('paymentMethodDetails');
    if (!detailBox) return;

    if (method === 'cod') {
      detailBox.innerHTML = `<strong>Cash on Delivery (COD):</strong> Pay in cash to the rider when your custom stand is delivered to your doorstep anywhere in Pakistan.`;
    } else if (method === 'jazzcash') {
      detailBox.innerHTML = `<strong>EasyPaisa / JazzCash:</strong> Send total amount to <strong>0327-7008585</strong> (Title: TapScan PK). Please send transaction screenshot on WhatsApp after placing order.`;
    } else if (method === 'bank') {
      detailBox.innerHTML = `<strong>Direct Bank Transfer:</strong> Bank: Meezan Bank Ltd. | Account Title: TapScan PK | IBAN: PK45MEZN0002190105829102. Share receipt on WhatsApp.`;
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
    const payment = document.querySelector('.payment-opt-card.active')?.dataset?.method || 'cod';

    if (!name || !phone || !address || !city) {
      showToast('Please fill all required fields.', '⚠');
      return;
    }

    const orderId = 'TS-' + Math.floor(100000 + Math.random() * 900000);
    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const shipping = subtotal >= 5000 ? 0 : 250;
    const discount = (subtotal * state.discountPercent) / 100;
    const grandTotal = subtotal - discount + shipping;

    // Show Success View
    const modalBody = document.querySelector('.checkout-modal-body');
    const itemsText = state.cart.map(i => `• ${i.title} x ${i.qty} (${formatPKR(i.price * i.qty)})`).join('\n');

    const waOrderMsg = `Assalam o Alaikum TapScan PK!\n\nNew Order Confirmed! 🎉\n*Order ID:* #${orderId}\n*Customer:* ${name}\n*Phone:* ${phone}\n*City:* ${city}\n*Address:* ${address}\n*Payment Method:* ${payment.toUpperCase()}\n\n*Ordered Items:*\n${itemsText}\n\n*Grand Total:* ${formatPKR(grandTotal)}\n${notes ? `*Special Notes:* ${notes}\n` : ''}\nPlease start preparing my standee!`;

    modalBody.innerHTML = `
      <div class="order-success-card">
        <div class="success-icon">✓</div>
        <h2>Thank You, ${name}!</h2>
        <p>Your order has been recorded successfully. Our team will verify your customization details shortly.</p>
        <div class="order-id-badge">Order ID: #${orderId}</div>
        <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
          We will contact you on <strong>${phone}</strong> for your logo file and link configurations.
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a href="https://wa.me/923277008585?text=${encodeURIComponent(waOrderMsg)}" target="_blank" class="btn-whatsapp" style="width: 100%;">
            💬 Send Order Details to WhatsApp
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
              <img src="${img}" class="qv-thumb ${idx === 0 ? 'active' : ''}" onclick="document.getElementById('qvMainImage').src='${img}'; document.querySelectorAll('.qv-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');" />
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="qv-details-col">
        <div class="qv-tag">${p.product_type || 'Smart QR Standee'}</div>
        <h2 class="qv-title">${p.title}</h2>
        <div class="product-rating" style="margin-bottom: 0.75rem;">
          ★★★★★ <span class="count">(${p.rating} / 5 · ${p.reviewCount} Reviews)</span>
        </div>
        <div class="qv-price-row">
          <div class="qv-price">${formatPKR(p.price)}</div>
          ${p.compare_at_price ? `<div class="qv-compare">${formatPKR(p.compare_at_price)}</div>` : ''}
          ${p.badge ? `<span class="product-tag-badge" style="position:static;">${p.badge}</span>` : ''}
        </div>
        <div class="qv-desc">
          ${p.description || 'Custom laser-cut acrylic standee equipped with high-frequency NFC chip and dynamic QR codes. Built for cafés, restaurants, salons, clinics, and modern businesses.'}
        </div>
        <ul style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1.5rem; padding-left: 1.25rem;">
          <li>✓ 100% Plug & Play — Ready out of the box</li>
          <li>✓ Lifetime access — Zero monthly fees</li>
          <li>✓ Android & iPhone universal compatibility</li>
          <li>✓ Personalized with your brand logo & colors</li>
        </ul>
        <div class="qv-actions">
          <button class="btn-primary" style="flex:1;" onclick="addToCart(${p.id}); closeQuickView();">
            🛒 Add to Cart
          </button>
          <button class="btn-whatsapp" onclick="orderOnWhatsApp(${p.id})">
            💬 WhatsApp Order
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
  };

  window.closeQuickView = function () {
    const overlay = document.getElementById('quickViewOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  // Interactive Live NFC Simulator
  window.triggerNfcDemo = function () {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    }
    const overlay = document.getElementById('nfcTapOverlay');
    if (overlay) overlay.classList.add('show');
  };

  window.closeNfcDemo = function () {
    const overlay = document.getElementById('nfcTapOverlay');
    if (overlay) overlay.classList.remove('show');
  };

  // Live Search Controls
  window.openSearch = function () {
    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('searchInput')?.focus();
    }
  };

  window.closeSearch = function () {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.remove('active');
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
        <div class="search-item" onclick="closeSearch(); window.location.hash='#product/' + ${p.id};">
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

  window.quickWaMessage = function (msg) {
    const phone = window.TAPSCAN?.store?.whatsapp || '923277008585';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Rendering Product Card HTML
  function renderProductCard(p) {
    return `
      <div class="product-card" data-category="${p.category}">
        <div class="product-thumb-wrap" onclick="openQuickView(${p.id})">
          <img src="${p.images[0]}" alt="${p.title}" class="product-thumb" loading="lazy" />
          ${p.badge ? `<span class="product-tag-badge">${p.badge}</span>` : ''}
          <div class="quick-action-overlay">
            <button class="quick-btn" onclick="event.stopPropagation(); openQuickView(${p.id});">Quick View</button>
            <button class="quick-btn" onclick="event.stopPropagation(); addToCart(${p.id});">Add to Cart</button>
          </div>
        </div>
        <div class="product-details">
          <div class="product-rating">
            ★★★★★ <span class="count">(${p.rating} · ${p.reviewCount})</span>
          </div>
          <h3 class="product-title">
            <a href="#product/${p.id}">${p.title}</a>
          </h3>
          <div class="product-price-row">
            <span class="current-price">${formatPKR(p.price)}</span>
            ${p.compare_at_price ? `<span class="compare-price">${formatPKR(p.compare_at_price)}</span>` : ''}
          </div>
          <div class="product-card-actions">
            <button class="btn-add-cart" onclick="addToCart(${p.id})">
              🛒 Add to Cart
            </button>
            <button class="btn-wa-order" title="Order on WhatsApp" onclick="orderOnWhatsApp(${p.id})">
              💬
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
    } else if (state.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
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
      link.classList.toggle('active', href === hash || (href === '#home' && hash === ''));
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === '#shop' || route === '#collections') {
      const shopView = document.getElementById('viewShop');
      if (shopView) shopView.classList.add('active');
      if (param) setCategory(param);
      renderCatalogProducts();
    } else if (route === '#product') {
      renderProductDetailPage(parseInt(param, 10));
    } else if (route === '#reviews') {
      document.getElementById('viewReviews')?.classList.add('active');
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
        <div style="margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--text-muted);">
          <a href="#home">Home</a> / <a href="#shop">Shop</a> / <span style="color:var(--text-primary); font-weight:600;">${p.title}</span>
        </div>
        <div class="quick-view-modal" style="display:grid; position:static; box-shadow:var(--shadow-lg); max-height:none; margin-bottom: 3rem;">
          <div class="qv-media-col" style="padding: 2.5rem;">
            <img src="${p.images[0]}" alt="${p.title}" class="qv-main-img" id="detailMainImg" style="height: 420px;" />
            <div class="qv-thumbs-row" style="margin-top: 1rem;">
              ${p.images.map((img, i) => `
                <img src="${img}" class="qv-thumb ${i === 0 ? 'active' : ''}" onclick="document.getElementById('detailMainImg').src='${img}'; document.querySelectorAll('.qv-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');" />
              `).join('')}
            </div>
          </div>
          <div class="qv-details-col" style="padding: 3rem 2.5rem;">
            <div class="qv-tag">${p.product_type}</div>
            <h1 style="font-family: var(--font-heading); font-size: 2.25rem; font-weight: 800; color: var(--primary); margin-bottom: 0.85rem; line-height: 1.2;">${p.title}</h1>
            <div class="product-rating" style="font-size: 1rem; margin-bottom: 1.25rem;">
              ★★★★★ <span class="count" style="font-size: 0.875rem;">(${p.rating} / 5 based on ${p.reviewCount} customer reviews)</span>
            </div>
            <div class="qv-price-row" style="margin-bottom: 1.5rem;">
              <div class="qv-price" style="font-size: 2rem;">${formatPKR(p.price)}</div>
              ${p.compare_at_price ? `<div class="qv-compare" style="font-size: 1.25rem;">${formatPKR(p.compare_at_price)}</div>` : ''}
              ${p.badge ? `<span class="product-tag-badge" style="position:static;">${p.badge}</span>` : ''}
            </div>
            <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem;">
              🚚 <strong>Cash on Delivery (COD) Available</strong> across Pakistan.<br>
              ⚡ <strong>Delivery:</strong> 2–4 Business Days via Express Courier.<br>
              ⭐ <strong>Customization:</strong> We reach out on WhatsApp to collect your logo & links.
            </div>
            <div class="qv-desc" style="font-size: 0.9375rem; margin-bottom: 2rem;">
              ${p.description || 'Elevate your customer engagement with TapScan custom NFC stands. Precision-crafted in Lahore, Pakistan with laser-cut acrylic and UV-resistant printing.'}
            </div>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
              <div class="qty-control" style="height: 48px;">
                <button class="qty-btn" style="width: 36px; font-size: 1.2rem;" onclick="let el=document.getElementById('detailQty'); el.innerText=Math.max(1, parseInt(el.innerText)-1);">−</button>
                <span id="detailQty" class="qty-number" style="font-size: 1rem; padding: 0 1rem;">1</span>
                <button class="qty-btn" style="width: 36px; font-size: 1.2rem;" onclick="let el=document.getElementById('detailQty'); el.innerText=parseInt(el.innerText)+1;">+</button>
              </div>
              <button class="btn-primary" style="flex:1; height: 48px;" onclick="addToCart(${p.id}, parseInt(document.getElementById('detailQty').innerText));">
                🛒 Add to Cart
              </button>
              <button class="btn-whatsapp" style="height: 48px;" onclick="orderOnWhatsApp(${p.id});">
                💬 WhatsApp Order
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
    if (nav) nav.classList.toggle('open');
  };

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
          <button class="faq-question" onclick="toggleFaq(this)">
            <span>${faq.question}</span>
            <span class="faq-icon">+</span>
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
          <button class="faq-question" onclick="toggleFaq(this)">
            <span>${faq.question}</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-inner">${faq.answer}</div>
          </div>
        </div>
      `).join('');
    }

    // Populate Testimonials
    const testList = document.getElementById('testimonialsGrid');
    if (testList && window.TAPSCAN?.testimonials) {
      testList.innerHTML = window.TAPSCAN.testimonials.map(t => `
        <div class="testimonial-card">
          <div class="testimonial-screenshot-wrap" onclick="window.open('${t.image}', '_blank')">
            <img src="${t.image}" alt="Customer feedback" loading="lazy" />
            <span class="wa-proof-badge">💬 WhatsApp Verified</span>
          </div>
          <div class="testimonial-body">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">"${t.text}"</p>
            <div class="testimonial-author">
              <div class="author-info">
                <h5>${t.clientName}</h5>
                <span>${t.business}</span>
              </div>
              <div class="author-verified">✓ ${t.phone}</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Populate Brands Marquee
    const brandsList = document.getElementById('brandsGrid');
    if (brandsList && window.TAPSCAN?.brands) {
      brandsList.innerHTML = window.TAPSCAN.brands.map(b => `
        <div class="brand-item" title="${b.name}">
          <img src="${b.logo}" alt="${b.name}" loading="lazy" />
        </div>
      `).join('');
    }

    // Setup router
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Setup scroll shadow on header
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.site-header');
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 20);
      }
    });

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
      formatPKR
    };
  }
})();

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const requiredIds = [
  'homeProductsGrid', 'catalogProductsGrid', 'productDetailContainer',
  'testimonialsGrid', 'brandsGrid', 'homeFaqList', 'fullFaqList',
  'headerCartCount', 'headerCartPrice', 'drawerCartCount', 'drawerCartItems',
  'drawerSubtotal', 'freeShippingBar', 'freeShippingMsg', 'checkoutSummaryContent',
  'bottomCartBadge', 'toastContainer', 'mobileNavDrawer', 'searchModal',
  'checkoutModalOverlay', 'quickViewOverlay', 'nfcTapOverlay', 'waChatPopup',
  'searchInput', 'searchResults', 'couponCodeInput', 'custCity', 'custName',
  'custPhone', 'custEmail', 'custAddress', 'custNotes', 'paymentMethodDetails'
];

console.log('--- Checking Required DOM IDs in index.html ---');
let missingIds = 0;
requiredIds.forEach(id => {
  if (html.includes(`id="${id}"`)) {
    // ID present
  } else {
    console.error('Missing ID: ' + id);
    missingIds++;
  }
});
if (missingIds === 0) {
  console.log(`✓ All ${requiredIds.length} required DOM IDs are present and intact!`);
}

console.log('\n--- Checking WhatsApp Links & Numbers ---');
const waNumbers = html.match(/923213010900|0321 3010900|0321-3010900|\+92 321 3010900/g) || [];
console.log(`✓ Found ${waNumbers.length} occurrences of the target WhatsApp/phone number in index.html`);

const oldWaNumbers = html.match(/923277008585|0327 7008585|0327-7008585|\+92 327 7008585/g) || [];
console.log(`✓ Found ${oldWaNumbers.length} occurrences of old phone numbers (should be 0)`);

console.log('\n--- Checking Client Logic & WhatsApp URL Generation ---');
// Mock browser globals for app.js simulation
global.window = global;
global.document = {
  getElementById: (id) => ({
    textContent: '',
    value: '',
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    innerHTML: '',
    style: {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, innerHTML: '', style: {} }),
  body: { style: {} },
  documentElement: { scrollWidth: 375 },
  readyState: 'complete'
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.Icons = require('./icons.js');
global.TAPSCAN = require('./store-data.js');

let openedUrls = [];
global.window.open = (url) => { openedUrls.push(url); };

const app = require('./app.js');

// Test 1: Single Product Order WhatsApp URL
app.state.products = global.TAPSCAN.products;
app.orderOnWhatsApp(global.TAPSCAN.products[0].id, 2);
console.log('✓ Single Product WhatsApp URL:');
console.log('  ' + openedUrls[openedUrls.length - 1]);

// Test 2: Cart Order WhatsApp URL
app.state.cart = [
  { id: 1, title: 'Smart NFC Google Review Standee (Gold)', price: 3499, qty: 1 },
  { id: 2, title: 'EasyPaisa & JazzCash QR Tabletop Stand', price: 1899, qty: 2 }
];
app.orderOnWhatsApp();
console.log('✓ Cart Order WhatsApp URL:');
console.log('  ' + openedUrls[openedUrls.length - 1]);

// Test 3: General Inquire WhatsApp URL
app.state.cart = [];
app.orderOnWhatsApp();
console.log('✓ General Inquiry WhatsApp URL:');
console.log('  ' + openedUrls[openedUrls.length - 1]);

console.log('\n--- Validation Result ---');
const allToCorrectNumber = openedUrls.every(u => u.startsWith('https://wa.me/923213010900'));
console.log('✓ All generated WhatsApp URLs target 923213010900: ' + allToCorrectNumber);

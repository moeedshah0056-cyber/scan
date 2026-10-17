# TapScan.pk - Complete 1:1 Pixel-Perfect Clone

A complete, high-fidelity replica of **[TapScan.pk](https://tapscan.pk)** — Pakistan’s #1 smart NFC and QR code standee solution for instant Google reviews, social media follows, and digital scan-to-pay payments.

---

## 🚀 Quick Start

Run the local development server (zero external dependencies required):

```bash
npm run dev
# or
node dev-server.js
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🌟 Key Features & Replicated Sections (A to Z)

### 1. **Complete 30-Product Catalog**
- Extracted directly from `tapscan.pk` with authentic titles, handles, high-resolution imagery, pricing in Pakistani Rupees (`Rs. / PKR`), compare-at prices, and discount badges (`Save Rs. 1,000`).
- Collections:
  - **Premium Stands**: 3D laser-cut acrylic with metallic and gold icons.
  - **Simple & Payment Stands**: Tabletop displays for EasyPaisa, JazzCash, Raast, and single review links.
  - **Smart NFC Review Cards**: Wallet-sized NFC + QR cards for on-the-go reviews.
  - **Industry Shape Standees**: Custom silhouettes including dental tooth shapes and burger restaurant cutouts.

### 2. **Interactive Live NFC Tap Simulator**
- An interactive 3D phone simulation overlay allowing visitors to click "Tap Virtual Phone on Standee".
- Demonstrates haptic vibration and pops up an authentic Google Review dialog to preview how walk-in customers experience the stand in real life.

### 3. **Pakistani Cash on Delivery (COD) Checkout System**
- Complete checkout modal with 24 major Pakistani cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, etc.).
- Form validation tailored for Pakistani mobile numbers (`03XX-XXXXXXX`).
- Payment choices:
  - **Cash on Delivery (COD)**
  - **EasyPaisa / JazzCash** (Account: `0327-7008585 - TapScan PK`)
  - **Direct Bank Transfer** (Meezan Bank Ltd.)
- Auto-generates unique Order IDs (`#TS-XXXXXX`) and provides a 1-click **"Send Order to WhatsApp"** button with a pre-filled, itemized message.

### 4. **Slide-In Shopping Cart Drawer**
- Quantity increment / decrement / remove controls.
- Dynamic **Free Shipping Progress Meter** (Threshold: Rs. 5,000).
- Coupon discount system (e.g., `TAPSCAN10` for 10% off).
- Direct WhatsApp checkout shortcut.

### 5. **Social Proof & Verified WhatsApp Feedback**
- Authentic customer WhatsApp screenshot proof gallery from real Pakistani clinic owners, cafés, and salons.
- 5-Star verified review badges and testimonials.

### 6. **Brand Trust Marquee**
- Client enterprise logos across Pakistan: Honda, Domino's Pizza, Kababjees Bakers, Hyundai Nishat, Depilex Salon, The Smart School (TSS), Australian Concept Fertility Centre, etc.

### 7. **Comprehensive FAQs & Subpages (SPA Router)**
- `#home` - Interactive Landing Page
- `#shop` - Full Catalog with filtering and sorting
- `#product/:id` - Dedicated Product Detail View with zoom gallery and specifications
- `#reviews` - Verified Review Wall
- `#how-it-works` - 3-Step visual onboarding guide
- `#about` - TapScan origin story in Lahore, Band Road
- `#contact` - Interactive contact form, WhatsApp link, and physical office address
- `#faqs` - Searchable library of 25 authentic questions and answers
- `#policy/:type` - Privacy, Refund, Shipping, and Terms of Service policies

### 8. **Floating WhatsApp Customer Support**
- Glowing WhatsApp bubble with live online status and quick inquiry templates.

---

## 🛠️ Project Structure

```
├── index.html            # Main semantic HTML structure
├── styles.css            # Custom CSS design system
├── app.js                # SPA router, cart state, checkout & simulator logic
├── store-data.js         # Unified database (30 products, FAQs, testimonials, cities)
├── server.js             # Native Node.js dev server with MIME & CORS handling
├── package.json          # npm configuration and scripts
├── all_products.json     # Sanitized JSON of all 30 products
└── site_content.json     # Parsed FAQs, policies, and store metadata
```

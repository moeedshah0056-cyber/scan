// TapUp.pk - Complete Store Data & Catalog
const TAPSCAN_DATA = {
  store: {
    name: "TapUp.pk",
    legalName: "Tap Up PK",
    tagline: "Boost Your Business in One Scan",
    description: "Pakistan’s #1 NFC and QR code stand solution for instant Google reviews, quick social media follows, and seamless scan-to-pay payments. Ideal for cafés, salons, clinics, and all types of local businesses.",
    phone: "+92 327 7008585",
    phoneDisplay: "0327 7008585",
    altPhone: "0325 7114725",
    whatsapp: "923277008585",
    whatsappUrl: "https://wa.me/923277008585",
    email: "info@tapup.pk",
    address: "B3 Second floor, 28 Band Road, Lahore 54000, Pakistan",
    city: "Lahore",
    country: "Pakistan",
    currency: "PKR",
    currencySymbol: "Rs.",
    freeDeliveryThreshold: 5000,
    logo: "logo.png",
    banners: {
      desktop: "https://www.tapscan.pk/cdn/shop/files/banner.webp?v=1776501438&width=1500",
      mobile: "https://www.tapscan.pk/cdn/shop/files/Web_Banner_Mobile_Version.webp?v=1776501437&width=1500",
      promo1: "https://www.tapscan.pk/cdn/shop/files/2_1.png?v=1764578169&width=1500",
      promo2: "https://www.tapscan.pk/cdn/shop/files/2_2.png?v=1764578168&width=1500"
    }
  },

  collections: [
    {
      id: "all",
      title: "All Products",
      handle: "all",
      description: "Browse Pakistan's complete range of custom NFC & QR code smart standees and cards."
    },
    {
      id: "premium-stands",
      title: "Premium Stands",
      handle: "premium-stands",
      badge: "Best Seller",
      image: "https://www.tapscan.pk/cdn/shop/files/Smart-NFC-Google-Review-QR-Code-Standee-Premium-edition-TapScan-pk-28331491983448.jpg?v=1763768626&width=600",
      description: "Laser cut 3D acrylic stands with metallic icons and dual NFC + QR technology."
    },
    {
      id: "simple-stands",
      title: "Simple & Payment Stands",
      handle: "simple-stands",
      badge: "Popular",
      image: "https://www.tapscan.pk/cdn/shop/files/EasyPaisa-Qr-Code-Standee-TapScan-pk-28324882776152.jpg?v=1763768620&width=600",
      description: "Compact single & dual QR code tabletop displays for Google Reviews, EasyPaisa, & JazzCash."
    },
    {
      id: "nfc-cards",
      title: "NFC Smart Cards",
      handle: "nfc-cards",
      badge: "Pocket Size",
      image: "https://www.tapscan.pk/cdn/shop/files/Smart-Google-Review-Card-QR-NFC-Review-Card-for-Fast-Reviews-TapScan-pk-28912768483416.jpg?v=1778614099&width=600",
      description: "Sleek wallet-sized NFC + QR cards for on-the-go reviews, Instagram followers, and digital networking."
    },
    {
      id: "shape-standees",
      title: "Custom Cutout Stands",
      handle: "shape-standees",
      badge: "Custom Shaped",
      image: "https://www.tapscan.pk/cdn/shop/files/Dental-Tooth-Shaped-Smart-NFC-2-in-1-Standee-For-Dentists-TapScan-pk-34403050061912.webp?v=1778614088&width=600",
      description: "Industry-specific silhouettes including tooth shapes for dentists and burger shapes for restaurants."
    }
  ],

  brands: [
    { name: "Honda Pakistan", logo: "https://www.tapscan.pk/cdn/shop/files/honda_1706089528.webp?v=1764574500" },
    { name: "Domino's Pizza", logo: "https://www.tapscan.pk/cdn/shop/files/dominos-pizza5190.jpg?v=1764574464" },
    { name: "Kababjees Bakers", logo: "https://www.tapscan.pk/cdn/shop/files/kababjees-bakers-new-logo.png?v=1764574666" },
    { name: "Hyundai Nishat", logo: "https://www.tapscan.pk/cdn/shop/files/hyundai-logo-brand-symbol-with-name-blue-design-south-korean-car-automobile-illustration-free-vector.jpg?v=1764574461" },
    { name: "Depilex Salon", logo: "https://www.tapscan.pk/cdn/shop/files/depilex_logo-black.png?v=1764574467" },
    { name: "The Smart School (TSS)", logo: "https://www.tapscan.pk/cdn/shop/files/tss-logo.png?v=1764574453" },
    { name: "Australian Concept Fertility Centre", logo: "https://www.tapscan.pk/cdn/shop/files/australian-concept-fertility-centre.png?v=1764574504" },
    { name: "CY8WE", logo: "https://www.tapscan.pk/cdn/shop/files/cy8we-logo.jpg?v=1764574471" },
    { name: "CW6IB", logo: "https://www.tapscan.pk/cdn/shop/files/cw6ib-logo.jpg?v=1764574480" }
  ],

  testimonials: [
    {
      id: 1,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.23_AM_2.jpg?v=1775892298",
      phone: "+92 319 ••••782",
      rating: 5,
      clientName: "Dr. Hamza Qureshi",
      business: "Aesthetic Dental Care, Lahore",
      text: "Assalam o alaikum! Received our tooth-shaped Google Review standee today. Acrylic quality and UV print are extraordinary! Customers just tap their phone and review opens instantly. MashAllah highly recommended!",
      date: "Verified Customer"
    },
    {
      id: 2,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.21_AM.jpg?v=1775892298",
      phone: "+92 323 ••••756",
      rating: 5,
      clientName: "M. Usman Tariq",
      business: "Roast & Brew Café, Islamabad",
      text: "Sir parcel mil gya hai. Packing boht safe thi aur standee boht premium lag rahi hai counter pe. Kal se ab tak 28 reviews collect ho chuke hain without asking customers twice!",
      date: "Verified Customer"
    },
    {
      id: 3,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.26_AM_2.jpg?v=1775892299",
      phone: "+92 302 ••••871",
      rating: 5,
      clientName: "Syeda Fatima",
      business: "Glamour Lounge Salon, Karachi",
      text: "The 4-in-1 standee with 3D cut icons looks so classy! Instagram followers and Google reviews both have doubled in just two weeks. Outstanding service TapScan team!",
      date: "Verified Customer"
    },
    {
      id: 4,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.22_AM.jpg?v=1775892299",
      phone: "+92 303 ••••388",
      rating: 5,
      clientName: "Bilal Ahmad",
      business: "Urban Couture, Faisalabad",
      text: "Top tier finish. NFC chip works instantly on iPhone and Samsung phones. Really impressed with the plug and play setup. No app needed at all.",
      date: "Verified Customer"
    },
    {
      id: 5,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.25_AM.jpg?v=1775892298",
      phone: "+92 334 ••••912",
      rating: 5,
      clientName: "Ali Raza",
      business: "The Burger Hub, Rawalpindi",
      text: "The burger cut-out standee is a total eye-catcher! Guests love the NFC tap feature, it feels like magic to them. Will order 3 more for our other branches.",
      date: "Verified Customer"
    },
    {
      id: 6,
      image: "https://www.tapscan.pk/cdn/shop/files/WhatsApp_Image_2026-04-11_at_11.54.24_AM_2.jpg?v=1775892299",
      phone: "+92 345 ••••601",
      rating: 5,
      clientName: "Zeeshan Butt",
      business: "FitPulse Gym, Multan",
      text: "Best investment for our reception desk. Easy to clean, sturdy acrylic base, and zero monthly fees. 10/10 service!",
      date: "Verified Customer"
    }
  ],

  pakistanCities: [
    "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", 
    "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", 
    "Sargodha", "Abbottabad", "Gujrat", "Rahim Yar Khan", "Sheikhupura", 
    "Jhelum", "Sahiwal", "Okara", "Sukkur", "Mardan", "Wah Cantt", "Kasur"
  ]
};

if (typeof module !== 'undefined') {
  module.exports = TAPSCAN_DATA;
}

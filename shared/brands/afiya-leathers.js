/**
 * ============================================================
 * BRAND CONFIG — single source of truth for brand identity
 * ============================================================
 * Swap this file (or switch shared/brands/*) when selling to
 * another client. Theme colors are applied as CSS variables
 * and wired through Tailwind tz-* aliases.
 * ============================================================
 */

const brand = {
  /* ---------- identity ---------- */
  id: "afiya-leathers",
  name: "Afiya Leathers",
  shortName: "Afiya",
  legalName: "Afiya Leathers",
  vertical: "leather",

  tagline: "Crafted in leather. Made to last.",

  /* ---------- public asset paths (files live in public/brand/) ---------- */
  logos: {
    navbar: "/brand/navbar-logo.png",
    footer: "/brand/footer-logo.svg",
    favicon: "/brand/favicon.svg",
  },

  /* ---------- theme (CSS variables applied at bootstrap) ---------- */
  theme: {
    colors: {
      primary: "#6B3A2A", // cognac
      secondary: "#C4A574", // brass
      accent: "#2C1810", // espresso
      muted: "#1C1917", // near-black text
      background: "#F3EEE6", // parchment
      surface: "#FFFBF7",
      border: "#D9D0C4",
      soft: "#E8DED2", // soft cognac wash (maps to tz-pink-soft)
      highlight: "#8B5A3C", // lighter cognac hover
      danger: "#B45353",
    },
    fonts: {
      body: '"Outfit", system-ui, sans-serif',
      heading: '"Cormorant Garamond", Georgia, serif',
    },
  },

  /* ---------- contact ---------- */
  contact: {
    email: "afiyaleather8@gmail.com",
    phone: "+91 97686 57387",
    phoneHref: "tel:+919768657387",
    whatsapp: "+91 97686 57387",
    whatsappUrl: "https://wa.me/message/INQEUCKOIIR4I1",
    website: "www.afiyaleather.com",
    websiteUrl: "https://afiyaleather.com",
    address: "B.30 Ground Floor Janta Chawl k.k.krishna Meman Marg, 90 Feet Road Mumbai Dharavi 400017, Mumbai, Maharashtra, India, 400017",
    hours: "Monday - Saturday: 10AM - 7PM",
    mapEmbedUrl: "",
    mapTitle: "Afiya Leathers Location",
  },

  /* ---------- about page copy ---------- */
  about: {
    heroTitle: "Crafted in leather.",
    heroHighlight: "Made to last.",
    heroSubtitle:
      "Afiya Leathers designs jackets, bags, and leather essentials with lasting material quality and a clean modern cut.",
    storyTitle: "Our Story",
    founderName: "Afiya Leathers",
    founderNote:
      "We started Afiya Leathers to bring honest craftsmanship to everyday leather — from motorcycle jackets to office bags — pieces you wear hard and keep longer.",
    heroVideo: "/brand/about-video.mp4",
    storyImage: "/brand/about-story.png",
    founderImage: "/brand/about-founder.jpg",
  },

  /* ---------- storefront media (files in public/brand/) ---------- */
  media: {
    placeholder: "/brand/product-placeholder.jpg",
    categories: {
      men: "/brand/categories/men.png",
      women: "/brand/categories/women.png",
      bags: "/brand/categories/bags.png",
      accessories: "/brand/categories/accessories.png",
      // legacy keys (Phase 1 compatibility until taxonomy rewrite)
      totes: "/brand/categories/men.png",
    },
    heroes: [
      {
        image: "/brand/heroes/hero-1.webp",
        title: "Leather jackets",
        subtitle: "Built for the road and the city",
        ctaLabel: "Shop jackets",
        ctaLink: "/shop",
      },
      {
        image: "/brand/heroes/hero-2.jpg",
        title: "For her",
        subtitle: "Biker silhouettes in real leather",
        ctaLabel: "Shop women",
        ctaLink: "/shop",
      },
      {
        image: "/brand/heroes/hero-3.webp",
        title: "Leather bags",
        subtitle: "Handbags, totes, and everyday carries",
        ctaLabel: "Shop bags",
        ctaLink: "/shop",
      },
      {
        image: "/brand/heroes/hero-4.webp",
        title: "Work-ready leather",
        subtitle: "Laptop and office bags with presence",
        ctaLabel: "Shop all",
        ctaLink: "/shop",
      },
    ],
    instagramFallback: [
      "/brand/instagram/feed-1.jpg",
      "/brand/instagram/feed-2.jpg",
      "/brand/instagram/feed-3.jpg",
      "/brand/lifestyle/leather-tote.jpg",
      "/brand/lifestyle/leather-blazer.jpg",
    ],
    library: [
      { label: "Men", path: "/brand/categories/men.png" },
      { label: "Women", path: "/brand/categories/women.png" },
      { label: "Bags", path: "/brand/categories/bags.png" },
      { label: "Accessories", path: "/brand/categories/accessories.png" },
      { label: "Hero 1", path: "/brand/heroes/hero-1.webp" },
      { label: "Hero 2", path: "/brand/heroes/hero-2.jpg" },
      { label: "Hero 3", path: "/brand/heroes/hero-3.webp" },
      { label: "Hero 4", path: "/brand/heroes/hero-4.webp" },
      { label: "Leather tote", path: "/brand/lifestyle/leather-tote.jpg" },
      { label: "Leather blazer", path: "/brand/lifestyle/leather-blazer.jpg" },
      { label: "Leather backpack", path: "/brand/lifestyle/leather-backpack.jpg" },
    ],
  },

  /* ---------- footer ---------- */
  footer: {
    blurb:
      "Afiya Leathers crafts jackets, bags, and leather essentials meant to be worn often and kept longer.",
    creditLine: "By Afiya Leathers",
    copyrightYear: 2026,
  },

  /* ---------- social (empty href = hide) ---------- */
  social: {
    facebook: "https://www.facebook.com/share/19N7iT3kiv/",
    twitter: "",
    instagram: "https://www.instagram.com/afiyaleather",
    linkedin: "",
    whatsapp: "https://wa.me/message/INQEUCKOIIR4I1",
  },

  /* ---------- commerce display ---------- */
  commerce: {
    currencySymbol: "₹",
    currencyCode: "INR",
    deliveryFee: 41,
    razorpayDisplayName: "Afiya Leathers",
    cloudinaryFolder: "afiya-leathers",
  },

  /* ---------- transactional email ---------- */
  email: {
    fromName: "Afiya Leathers",
    orderConfirmedSubject: "✅ Order Confirmed – Afiya Leathers",
    paymentSuccessSubject: "✅ Payment Successful – Afiya Leathers",
    statusUpdatedSubject: "Afiya Leathers - Order Status Updated",
    shippedSubject: "Afiya Leathers — Your order has been shipped",
    outForDeliverySubject: "Afiya Leathers — Out for delivery",
    deliveredSubject: "Afiya Leathers — Order delivered",
    returnApprovedSubject: "Afiya Leathers — Return pickup scheduled",
    partialAdvanceSubject: "Afiya Leathers — Advance payment received",
    balanceCollectedSubject: "Afiya Leathers — Order fully paid",
    advanceRefundedSubject: "Afiya Leathers — Advance refunded",
    advanceRetainedSubject: "Afiya Leathers — Delivery unsuccessful",
    verifyEmailSubject: "Verify Your Email — Afiya Leathers",
    resetPasswordSubject: "Reset Password — Afiya Leathers",
    newOrderAdminSubject: "New Order Received — Afiya Leathers",
    newPaidOrderAdminSubject: "New Paid Order — Afiya Leathers",
    partialAdvanceAdminSubject: "Partial advance paid — Afiya Leathers",
  },

  /* ---------- SEO defaults ---------- */
  seo: {
    defaultTitle: "Afiya Leathers",
    titleTemplate: "%s | Afiya Leathers",
    defaultDescription:
      "Crafted in leather. Made to last. Shop leather jackets, bags, belts, and more at Afiya Leathers.",
  },

  /* ---------- catalog ---------- */
  catalog: {
    primary: {
      value: "men",
      label: "Men",
      path: "/shop?department=men",
    },
    secondary: {
      value: "bags",
      label: "Bags",
      path: "/shop?department=bags",
    },
    nav: [
      { name: "Home", label: "Home", path: "/" },
      { name: "Shop", label: "Shop", path: "/shop" },
      { name: "Men", label: "Men", path: "/shop?department=men" },
      { name: "Women", label: "Women", path: "/shop?department=women" },
      { name: "Bags", label: "Bags", path: "/shop?department=bags" },
      { name: "About", label: "About", path: "/about" },
      { name: "Contact", label: "Contact", path: "/contact" },
    ],
    searchSuggestions: [
      "Leather Jacket",
      "Biker Jacket",
      "Suede Jacket",
      "Leather Blazer",
      "Handbag",
      "Laptop Bag",
      "Sling Bag",
      "Backpack",
      "Leather Belt",
      "Wallet",
    ],
  },

  /* ---------- homepage featured videos ---------- */
  featuredVideos: [
    {
      src: "/brand/featured-1.mp4",
      poster: "/brand/lifestyle/leather-blazer.jpg",
      title: "Afiya jackets",
    },
    {
      src: "/brand/featured-2.mp4",
      poster: "/brand/lifestyle/leather-tote.jpg",
      title: "Leather details",
    },
  ],

  /* ---------- admin UI ---------- */
  admin: {
    panelTitle: "Afiya Leathers Admin",
    addProductTitle: "Afiya Leathers Admin - Add Products",
  },
};

export default brand;

/**
 * ============================================================
 * BRAND CONFIG — Zayn Leathers
 * ============================================================
 * Cloudinary folder remains `afiya-leathers` (existing media).
 * Mongo DB remains `afiyaleathers` (existing catalogue).
 * ============================================================
 */

const brand = {
  /* ---------- identity ---------- */
  id: "zayn-leathers",
  name: "Zayn Leathers",
  shortName: "Zayn",
  legalName: "Zayn Leathers",
  vertical: "leather",

  tagline: "Crafted in leather. Made to last.",

  /* ---------- public asset paths (files live in public/brand/) ---------- */
  logos: {
    navbar: "/brand/navbar-logo.svg",
    footer: "/brand/footer-logo.svg",
    favicon: "/brand/favicon.svg",
  },

  /* ---------- theme (CSS variables applied at bootstrap) ---------- */
  theme: {
    colors: {
      primary: "#6B3A2A",
      secondary: "#C4A574",
      accent: "#2C1810",
      muted: "#1C1917",
      background: "#F3EEE6",
      surface: "#FFFBF7",
      border: "#D9D0C4",
      soft: "#E8DED2",
      highlight: "#8B5A3C",
      danger: "#B45353",
    },
    fonts: {
      body: '"Outfit", system-ui, sans-serif',
      heading: '"Cormorant Garamond", Georgia, serif',
    },
  },

  /* ---------- contact (same business as Afiya rebrand — update domain when Zayn site goes live) ---------- */
  contact: {
    email: "afiyaleather8@gmail.com",
    phone: "+91 97686 57387",
    phoneHref: "tel:+919768657387",
    whatsapp: "+91 97686 57387",
    whatsappUrl: "https://wa.me/919768657387",
    website: "Zayn Leathers",
    websiteUrl: "http://localhost:5173",
    address:
      "B.30 Ground Floor Janta Chawl K.K. Krishna Meman Marg, 90 Feet Road, Dharavi, Mumbai, Maharashtra 400017",
    hours: "Monday - Saturday: 10AM - 7PM",
    mapEmbedUrl: "",
    mapTitle: "Zayn Leathers Location",
  },

  /* ---------- about page copy ---------- */
  about: {
    heroTitle: "Crafted in leather.",
    heroHighlight: "Made to last.",
    heroSubtitle:
      "Zayn Leathers designs jackets, bags, and leather essentials with lasting material quality and a clean modern cut.",
    storyTitle: "Our Story",
    founderName: "Zayn Leathers",
    founderNote:
      "We started Zayn Leathers to bring honest craftsmanship to everyday leather — from motorcycle jackets to office bags — pieces you wear hard and keep longer.",
    heroVideo: "/brand/about-video.mp4",
    storyImage: "/brand/about-story.png",
    founderImage: "/brand/about-founder.jpg",
  },

  /* ---------- storefront media (files in public/brand/) ---------- */
  media: {
    placeholder: "/brand/product-placeholder.svg",
    categories: {
      men: "/brand/categories/men.svg",
      women: "/brand/categories/women.svg",
      bags: "/brand/categories/bags.svg",
      accessories: "/brand/categories/accessories.svg",
      totes: "/brand/categories/men.svg",
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
      { label: "Men", path: "/brand/categories/men.svg" },
      { label: "Women", path: "/brand/categories/women.svg" },
      { label: "Bags", path: "/brand/categories/bags.svg" },
      { label: "Accessories", path: "/brand/categories/accessories.svg" },
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
      "Zayn Leathers crafts jackets, bags, and leather essentials meant to be worn often and kept longer.",
    creditLine: "By Zayn Leathers",
    copyrightYear: 2026,
  },

  /* ---------- social (empty href = hide) ---------- */
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    whatsapp: "",
  },

  /* ---------- commerce display ---------- */
  commerce: {
    currencySymbol: "₹",
    currencyCode: "INR",
    deliveryFee: 41,
    razorpayDisplayName: "Zayn Leathers",
    cloudinaryFolder: "afiya-leathers",
  },

  /* ---------- transactional email ---------- */
  email: {
    fromName: "Zayn Leathers",
    orderConfirmedSubject: "✅ Order Confirmed – Zayn Leathers",
    paymentSuccessSubject: "✅ Payment Successful – Zayn Leathers",
    statusUpdatedSubject: "Zayn Leathers - Order Status Updated",
    shippedSubject: "Zayn Leathers — Your order has been shipped",
    outForDeliverySubject: "Zayn Leathers — Out for delivery",
    deliveredSubject: "Zayn Leathers — Order delivered",
    invoiceReadySubject: "Your invoice is ready — Zayn Leathers",
    returnApprovedSubject: "Zayn Leathers — Return pickup scheduled",
    partialAdvanceSubject: "Zayn Leathers — Advance payment received",
    balanceCollectedSubject: "Zayn Leathers — Order fully paid",
    advanceRefundedSubject: "Zayn Leathers — Advance refunded",
    advanceRetainedSubject: "Zayn Leathers — Delivery unsuccessful",
    verifyEmailSubject: "Verify Your Email — Zayn Leathers",
    resetPasswordSubject: "Reset Password — Zayn Leathers",
    newOrderAdminSubject: "New Order Received — Zayn Leathers",
    newPaidOrderAdminSubject: "New Paid Order — Zayn Leathers",
    partialAdvanceAdminSubject: "Partial advance paid — Zayn Leathers",
  },

  /* ---------- SEO defaults ---------- */
  seo: {
    defaultTitle: "Zayn Leathers",
    titleTemplate: "%s | Zayn Leathers",
    defaultDescription:
      "Crafted in leather. Made to last. Shop leather jackets, bags, belts, and more at Zayn Leathers.",
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
      title: "Zayn jackets",
    },
    {
      src: "/brand/featured-2.mp4",
      poster: "/brand/lifestyle/leather-tote.jpg",
      title: "Leather details",
    },
  ],

  /* ---------- admin UI ---------- */
  admin: {
    panelTitle: "Zayn Leathers Admin",
    addProductTitle: "Zayn Leathers Admin - Add Products",
  },
};

export default brand;

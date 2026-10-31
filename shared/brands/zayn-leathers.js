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
    navbar: "/brand/zayn-logo.png",
    footer: "/brand/zayn-logo.png",
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

  /* ---------- contact ---------- */
  contact: {
    email: "zaynleather@gmail.com",
    phone: "+91 90229 81515",
    phoneHref: "tel:+919022981515",
    whatsapp: "+91 90229 81515",
    whatsappUrl: "https://wa.me/919022981515",
    website: "Zayn Leathers",
    websiteUrl: "https://zaynleather.com",
    address: "",
    hours: "Monday – Saturday · replies within 24 hours",
    mapEmbedUrl: "",
    mapTitle: "Zayn Leathers Location",
  },

  /* ---------- about page copy ---------- */
  about: {
    heroTitle: "Established",
    heroHighlight: "2015",
    heroSubtitle:
      "Manufacturer-direct genuine leather jackets for men and women, made to a standard we inspect ourselves.",
    storyTitle: "Our Story",
    storyLead:
      "Established in 2015, Zayn Leathers is a manufacturer-direct brand dedicated to handcrafted genuine leather jackets for men and women. Exceptional jackets should be defined by craftsmanship, not excessive markups.",
    storyBody:
      "Each jacket is handcrafted from carefully selected genuine leather, combining timeless design, comfort, and lasting durability. From leather selection to the final inspection, we oversee every stage of production. Every jacket is checked again before it is dispatched.",
    founderName: "Zayn Leathers",
    founderNote:
      "Exceptional leather jackets should be defined by craftsmanship, not excessive markups.",
    heroVideo: "/brand/about-video.mp4",
    storyImage: "/brand/about-story.png",
    founderImage: "/brand/about-founder.jpg",
  },

  /* ---------- storefront media (files in public/brand/) ---------- */
  media: {
    placeholder: "/brand/product-placeholder.svg",
    categories: {
      men: "/brand/categories/men.png",
      women: "/brand/categories/women.png",
      bags: "/brand/categories/accessories.png",
      accessories: "/brand/categories/accessories.png",
      kids: "/brand/categories/kids.png",
      totes: "/brand/categories/accessories.png",
    },
    heroes: [
      {
        image: "/brand/heroes/banner-1-men.png",
        title: "Leather jackets",
        highlight: "For him",
        subtitle: "Built for the road and the city.",
        ctaLabel: "Shop men",
        ctaLink: "/shop?department=men",
      },
      {
        image: "/brand/heroes/banner-2-women.png",
        title: "For her",
        highlight: "Shearling",
        subtitle: "A warmer jacket, cut to be worn often.",
        ctaLabel: "Shop women",
        ctaLink: "/shop?department=women",
      },
      {
        image: "/brand/heroes/banner-3-accessories.png",
        title: "Leather bags",
        highlight: "Everyday carry",
        subtitle: "Totes, belts, and leather essentials.",
        ctaLabel: "Shop accessories",
        ctaLink: "/shop?department=accessories",
      },
      {
        image: "/brand/heroes/banner-4-collection.png",
        title: "Women's jackets",
        highlight: "Shearling collar",
        subtitle: "Genuine leather, checked before it leaves.",
        ctaLabel: "Shop all",
        ctaLink: "/shop",
      },
    ],
    instagramFallback: [
      { image: "/brand/categories/men.png", caption: "Men", productLink: "/shop?department=men" },
      { image: "/brand/categories/women.png", caption: "Women", productLink: "/shop?department=women" },
      { image: "/brand/categories/accessories.png", caption: "Accessories", productLink: "/shop?department=accessories" },
    ],
    library: [
      { label: "Men", path: "/brand/categories/men.png" },
      { label: "Women", path: "/brand/categories/women.png" },
      { label: "Accessories", path: "/brand/categories/accessories.png" },
      { label: "Kids", path: "/brand/categories/kids.png" },
      { label: "Banner men", path: "/brand/heroes/banner-1-men.png" },
      { label: "Banner women", path: "/brand/heroes/banner-2-women.png" },
      { label: "Banner accessories", path: "/brand/heroes/banner-3-accessories.png" },
      { label: "Banner collection", path: "/brand/heroes/banner-4-collection.png" },
      { label: "Leather tote", path: "/brand/lifestyle/leather-tote.jpg" },
      { label: "Leather blazer", path: "/brand/lifestyle/leather-blazer.jpg" },
      { label: "Leather backpack", path: "/brand/lifestyle/leather-backpack.jpg" },
    ],
  },

  /* ---------- footer ---------- */
  footer: {
    blurb:
      "Established in 2015. Zayn Leathers is a manufacturer-direct house for handcrafted genuine leather jackets for men and women.",
    creditLine: "By Zayn Leathers",
    copyrightYear: 2026,
  },

  /* ---------- social (empty href = hide) ---------- */
  social: {
    facebook: "",
    instagram: "https://www.instagram.com/zaynleather.in/",
    pinterest: "https://www.pinterest.com/zaynleather/",
    twitter: "https://x.com/leather_zayn",
    linkedin: "",
    ebay: "https://ebay.us/m/G4lQzb",
    whatsapp: "https://wa.me/919022981515",
    reels: [
      "https://www.instagram.com/reel/C2uofJip8aF/",
      "https://www.instagram.com/reel/DfCqEzbNaej/",
      "https://www.instagram.com/reel/DeU7c0sCR15/",
      "https://www.instagram.com/reel/DdlTSdPtmBd/",
      "https://www.instagram.com/reel/Ddhi1TdMc-g/",
      "https://www.instagram.com/reel/DcytdCQsiYD/",
    ],
  },

  /* ---------- welcome / entry popup (Phase D) ---------- */
  popup: {
    enabled: true,
    delayMs: 1800,
    eyebrow: "Welcome gift",
    headline: "₹500 off your first leather piece",
    subcopy:
      "Enter your email for an exclusive code. Offer valid while supplies last.",
    ctaPrimary: "Unlock your offer",
    ctaSecondary: "when you sign up for emails",
    successMessage: "We'll send your welcome offer shortly. Happy shopping.",
    // Prefer a lifestyle shot; falls back to hero / placeholder
    image: "/brand/heroes/banner-3-accessories.png",
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
      "Established in 2015, Zayn Leathers handcrafts genuine leather jackets for men and women, with free worldwide shipping.",
  },

  /* ---------- catalog ---------- */
  catalog: {
    primary: {
      value: "men",
      label: "Men",
      path: "/shop?department=men",
    },
    secondary: {
      value: "accessories",
      label: "Accessories",
      path: "/shop?department=accessories",
    },
    /* Departments + colours for Shop chips / Woo checklist */
    taxonomy: {
      departments: [
        { slug: "men", label: "Men" },
        { slug: "women", label: "Women" },
        { slug: "accessories", label: "Accessories" },
        { slug: "kids", label: "Kids" },
      ],
      colours: ["black", "brown", "blue", "green", "white", "red", "grey"],
      categories: {
        men: [
          "leather-jackets",
          "bomber-jackets",
          "biker-jackets",
          "suede-jackets",
          "shearling-jackets",
          "sheepskin-jackets",
          "aviator-jackets",
          "hooded-jackets",
          "blouson-jackets",
          "distressed-jackets",
          "faux-leather-jackets",
          "perforated-jackets",
          "slim-fit-jackets",
          "vintage-jackets",
          "varsity-jackets",
          "puffer-jackets",
          "leather-blazers",
          "leather-coats",
          "sheepskin-coats",
          "shearling-coats",
          "trench-coats",
          "double-breasted-coats",
          "leather-gilets",
          "leather-waistcoats",
          "leather-shirt-jackets",
          "leather-pants",
        ],
        women: [
          "leather-jackets",
          "biker-jackets",
          "bomber-jackets",
          "suede-jackets",
          "shearling-jackets",
          "sheepskin-jackets",
          "aviator-jackets",
          "hooded-jackets",
          "distressed-jackets",
          "faux-leather-jackets",
          "slim-fit-jackets",
          "oversized-jackets",
          "vintage-jackets",
          "leather-blazers",
          "leather-coats",
          "shearling-coats",
          "sheepskin-coats",
          "trench-coats",
          "double-breasted-coats",
          "leather-waistcoats",
        ],
        accessories: [
          "leather-bags",
          "leather-belts",
          "leather-caps",
          "leather-gloves",
          "leather-shoes",
          "leather-wallets",
          "leather-leggings",
          "leather-cushion-covers",
        ],
      },
      other: [
        { slug: "kids-leather-jackets", label: "Kids Leather Jackets", path: "/shop?department=kids" },
        { slug: "movie-jackets", label: "Movie Jackets", path: "/shop?category=movie-jackets" },
        { slug: "superhero-jackets", label: "Superhero Jackets", path: "/shop?category=superhero-jackets" },
        { slug: "video-game-jackets", label: "Video Game Jackets", path: "/shop?category=video-game-jackets" },
      ],
    },
    /* Hidden from the top menu, footer, and homepage. Still available in the shop. */
    hiddenDepartments: ["kids", "accessories"],
    nav: [
      {
        name: "Men",
        label: "Men",
        path: "/shop?department=men",
        mega: "men",
      },
      {
        name: "New Arrivals",
        label: "New Arrivals",
        path: "/shop?sort=newest",
      },
      {
        name: "Women",
        label: "Women",
        path: "/shop?department=women",
        mega: "women",
      },
      {
        name: "Accessories",
        label: "Accessories",
        path: "/shop?department=accessories",
        mega: "accessories",
      },
      {
        name: "Movie Jackets",
        label: "Movie Jackets",
        path: "/shop?category=movie-jackets",
      },
      {
        name: "Custom Leather Jackets",
        label: "Custom Leather Jackets",
        short: "Custom",
        path: "/custom-jackets",
        highlight: true,
      },
      { name: "Contact", label: "Contact Us", path: "/contact" },
    ],
    /* Mega-menu fallbacks — full client catalogue (Colour = filter, not Woo cat) */
    megaMenu: {
      men: [
        {
          title: "Jackets",
          links: [
            { label: "Leather Jackets", path: "/shop?department=men&category=leather-jackets" },
            { label: "Bomber Jackets", path: "/shop?department=men&category=bomber-jackets" },
            { label: "Biker Jackets", path: "/shop?department=men&category=biker-jackets" },
            { label: "Suede Jackets", path: "/shop?department=men&category=suede-jackets" },
            { label: "Shearling Jackets", path: "/shop?department=men&category=shearling-jackets" },
            { label: "Sheepskin Jackets", path: "/shop?department=men&category=sheepskin-jackets" },
            { label: "Aviator Jackets", path: "/shop?department=men&category=aviator-jackets" },
            { label: "Hooded Jackets", path: "/shop?department=men&category=hooded-jackets" },
          ],
        },
        {
          title: "More jackets",
          links: [
            { label: "Blouson Jackets", path: "/shop?department=men&category=blouson-jackets" },
            { label: "Distressed Jackets", path: "/shop?department=men&category=distressed-jackets" },
            { label: "Faux Leather Jackets", path: "/shop?department=men&category=faux-leather-jackets" },
            { label: "Perforated Jackets", path: "/shop?department=men&category=perforated-jackets" },
            { label: "Slim Fit Jackets", path: "/shop?department=men&category=slim-fit-jackets" },
            { label: "Vintage Jackets", path: "/shop?department=men&category=vintage-jackets" },
            { label: "Varsity Jackets", path: "/shop?department=men&category=varsity-jackets" },
            { label: "Puffer Jackets", path: "/shop?department=men&category=puffer-jackets" },
          ],
        },
        {
          title: "Coats & more",
          links: [
            { label: "Leather Blazers", path: "/shop?department=men&category=leather-blazers" },
            { label: "Leather Coats", path: "/shop?department=men&category=leather-coats" },
            { label: "Sheepskin Coats", path: "/shop?department=men&category=sheepskin-coats" },
            { label: "Shearling Coats", path: "/shop?department=men&category=shearling-coats" },
            { label: "Trench Coats", path: "/shop?department=men&category=trench-coats" },
            { label: "Double Breasted Coats", path: "/shop?department=men&category=double-breasted-coats" },
            { label: "Leather Gilets", path: "/shop?department=men&category=leather-gilets" },
            { label: "Leather Waistcoats", path: "/shop?department=men&category=leather-waistcoats" },
            { label: "Leather Shirt Jackets", path: "/shop?department=men&category=leather-shirt-jackets" },
            { label: "Leather Pants", path: "/shop?department=men&category=leather-pants" },
          ],
        },
        {
          title: "Shop by colour",
          links: [
            { label: "Black", path: "/shop?department=men&color=black" },
            { label: "Brown", path: "/shop?department=men&color=brown" },
            { label: "Blue", path: "/shop?department=men&color=blue" },
            { label: "Green", path: "/shop?department=men&color=green" },
            { label: "White", path: "/shop?department=men&color=white" },
            { label: "Red", path: "/shop?department=men&color=red" },
          ],
        },
      ],
      women: [
        {
          title: "Jackets",
          links: [
            { label: "Leather Jackets", path: "/shop?department=women&category=leather-jackets" },
            { label: "Biker Jackets", path: "/shop?department=women&category=biker-jackets" },
            { label: "Bomber Jackets", path: "/shop?department=women&category=bomber-jackets" },
            { label: "Suede Jackets", path: "/shop?department=women&category=suede-jackets" },
            { label: "Shearling Jackets", path: "/shop?department=women&category=shearling-jackets" },
            { label: "Sheepskin Jackets", path: "/shop?department=women&category=sheepskin-jackets" },
            { label: "Aviator Jackets", path: "/shop?department=women&category=aviator-jackets" },
          ],
        },
        {
          title: "More jackets",
          links: [
            { label: "Hooded Jackets", path: "/shop?department=women&category=hooded-jackets" },
            { label: "Distressed Jackets", path: "/shop?department=women&category=distressed-jackets" },
            { label: "Faux Leather Jackets", path: "/shop?department=women&category=faux-leather-jackets" },
            { label: "Slim Fit Jackets", path: "/shop?department=women&category=slim-fit-jackets" },
            { label: "Oversized Jackets", path: "/shop?department=women&category=oversized-jackets" },
            { label: "Vintage Jackets", path: "/shop?department=women&category=vintage-jackets" },
          ],
        },
        {
          title: "Coats & more",
          links: [
            { label: "Leather Blazers", path: "/shop?department=women&category=leather-blazers" },
            { label: "Leather Coats", path: "/shop?department=women&category=leather-coats" },
            { label: "Shearling Coats", path: "/shop?department=women&category=shearling-coats" },
            { label: "Sheepskin Coats", path: "/shop?department=women&category=sheepskin-coats" },
            { label: "Trench Coats", path: "/shop?department=women&category=trench-coats" },
            { label: "Double Breasted Coats", path: "/shop?department=women&category=double-breasted-coats" },
            { label: "Leather Waistcoats", path: "/shop?department=women&category=leather-waistcoats" },
          ],
        },
        {
          title: "Shop by colour",
          links: [
            { label: "Black", path: "/shop?department=women&color=black" },
            { label: "Brown", path: "/shop?department=women&color=brown" },
            { label: "Blue", path: "/shop?department=women&color=blue" },
            { label: "Green", path: "/shop?department=women&color=green" },
            { label: "White", path: "/shop?department=women&color=white" },
            { label: "Red", path: "/shop?department=women&color=red" },
          ],
        },
      ],
      accessories: [
        {
          title: "Bags & wear",
          links: [
            { label: "Leather Bags", path: "/shop?department=accessories&category=leather-bags" },
            { label: "Leather Belts", path: "/shop?department=accessories&category=leather-belts" },
            { label: "Leather Caps", path: "/shop?department=accessories&category=leather-caps" },
            { label: "Leather Gloves", path: "/shop?department=accessories&category=leather-gloves" },
            { label: "Leather Shoes", path: "/shop?department=accessories&category=leather-shoes" },
            { label: "Leather Wallets", path: "/shop?department=accessories&category=leather-wallets" },
            { label: "Leather Leggings", path: "/shop?department=accessories&category=leather-leggings" },
          ],
        },
        {
          title: "Other",
          links: [
            { label: "Kids Leather Jackets", path: "/shop?department=kids" },
            { label: "Movie Jackets", path: "/shop?category=movie-jackets" },
            { label: "Superhero Jackets", path: "/shop?category=superhero-jackets" },
            { label: "Video Game Jackets", path: "/shop?category=video-game-jackets" },
          ],
        },
        {
          title: "Quick links",
          links: [
            { label: "All Accessories", path: "/shop?department=accessories" },
            { label: "Shop Men", path: "/shop?department=men" },
            { label: "Shop Women", path: "/shop?department=women" },
            { label: "Custom Jackets", path: "/custom-jackets" },
          ],
        },
      ],
    },
    /* Woo slug aliases — bags → accessories; keep old URLs working */
    slugAliases: {
      men: ["men", "mens", "men-s", "mens-jackets", "men-jackets"],
      women: ["women", "womens", "women-s", "womens-jackets", "women-jackets"],
      kids: ["kids", "kid", "children", "boys", "girls", "kids-leather-jackets"],
      accessories: [
        "accessories",
        "accessory",
        "bags",
        "bag",
        "handbags",
        "totes",
        "leather-bags",
        "belts",
        "wallets",
        "gloves",
      ],
      "movie-jackets": ["movie-jackets", "movie", "celebrity-jackets"],
      "superhero-jackets": ["superhero-jackets", "superhero"],
      "video-game-jackets": ["video-game-jackets", "video-game", "gaming-jackets"],
      "leather-jackets": ["leather-jackets", "women-leather-jackets", "mens-leather-jackets"],
      "suede-jackets": ["suede-jackets", "women-suede-jackets", "mens-suede-jackets"],
      "biker-jackets": ["biker-jackets", "women-biker-jackets"],
      "bomber-jackets": ["bomber-jackets", "women-bomber-jackets"],
      "sheepskin-jackets": ["sheepskin-jackets", "women-sheepskin-jackets"],
      "leather-shirt-jackets": ["leather-shirt-jackets", "shirt-jackets", "suede-shirts"],
      "double-breasted-coats": ["double-breasted-coats", "trench-coats"],
      "wool-jackets": ["wool-jackets", "women-wool-jackets"],
      "oversized-jackets": ["oversized-jackets", "women-oversized-jackets"],
    },
    promoFallback: "Free expedited shipping worldwide · Handcrafted leather",
    searchSuggestions: [
      "Leather Jacket",
      "Biker Jacket",
      "Suede Jacket",
      "Shearling Jacket",
      "Leather Blazer",
      "Leather Bag",
      "Leather Belt",
      "Wallet",
      "Movie Jacket",
      "Aviator Jacket",
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

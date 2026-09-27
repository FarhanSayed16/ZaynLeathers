import brand from "./brand.config.js";

/** Default footer policy copy — seeded in SiteSettings and used as storefront fallback. */
export function defaultPolicies(brandName = brand.name) {
  return {
    shipping: {
      title: "Shipping policy",
      body: [
        `${brandName} ships across India. Orders are typically packed within 1–2 business days after confirmation.`,
        "Standard delivery is usually 5–10 business days depending on your pincode. You will receive tracking details by email once the courier picks up the parcel.",
        "A delivery fee may apply below the free-shipping threshold shown at checkout. Remote or non-serviceable pincodes cannot be shipped.",
        "Please ensure the shipping address and phone number are correct. Failed delivery due to an incomplete address may incur extra courier charges.",
      ],
    },
    returns: {
      title: "Returns & refunds",
      body: [
        "If an item arrives damaged, defective, or incorrect, contact us within 48 hours of delivery with photos so we can arrange a return or replacement.",
        "Unused items in original condition may be eligible for return as stated at the time of purchase. Custom-made or heavily used leather goods may not be returnable.",
        "Once we receive and inspect a return, refunds (if approved) go back to the original payment method. Cash-on-delivery refunds may be issued by bank transfer.",
        "Advance / partial payments follow the notice shown at checkout if a parcel is refused or returned undelivered.",
      ],
    },
    privacy: {
      title: "Privacy policy",
      body: [
        `We collect the name, email, phone, address, and order details needed to run ${brandName} — accounts, checkout, shipping, and support.`,
        "Payment card data is processed by our payment partner (when online payments are enabled). We do not store full card numbers on our servers.",
        "We use cookies and similar storage for login, cart, and site preferences. We do not sell your personal data.",
        "To update or delete account information, use My Account or email us via the Contact page.",
      ],
    },
    terms: {
      title: "Terms of use",
      body: [
        `By using ${brandName} you agree to shop in good faith, provide accurate details, and not misuse the site or our staff.`,
        "Product colours and textures can vary slightly from photos because leather is a natural material. Prices and stock can change without notice.",
        "We may refuse or cancel an order in case of pricing errors, suspected fraud, or stock issues, and will notify you if that happens.",
        "These pages are provided for customer information. For a specific order, the details on that order and any written confirmation apply.",
      ],
    },
  };
}

export const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms"];

export function mergePolicies(stored) {
  const defaults = defaultPolicies();
  const src = stored && typeof stored === "object" ? stored : {};
  const merged = {};
  for (const slug of POLICY_SLUGS) {
    const def = defaults[slug];
    const cur = src[slug] || {};
    merged[slug] = {
      title: String(cur.title || def.title).trim() || def.title,
      body:
        Array.isArray(cur.body) && cur.body.filter(Boolean).length
          ? cur.body.map(String).filter(Boolean)
          : def.body,
    };
  }
  return merged;
}

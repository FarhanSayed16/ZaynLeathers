import brand from "./brand.config.js";

/** Default footer policy copy — seeded in SiteSettings and used as storefront fallback. */
export function defaultPolicies(brandName = brand.name) {
  return {
    shipping: {
      title: "Shipping policy",
      body: [
        `${brandName} offers free expedited shipping worldwide on every order.`,
        "Orders ship with DHL Express, FedEx International Priority, UPS Express Saver, or Aramex International.",
        "Every order is processed within 4–5 business days after payment. Custom orders can take longer.",
        "USA, UK, Canada, and Europe: 4–6 business days. Australia and New Zealand: 5–7 business days. Asia and the Middle East: 4–6 business days. Rest of the world: 7–10 business days.",
        "Every shipment is tracked. You receive a tracking number once the order is dispatched.",
        "Items are packed in secure packaging for the journey.",
      ],
    },
    returns: {
      title: "Returns & refunds",
      body: [
        "If you are not satisfied, you can return an item within 30 days of delivery.",
        "The item must be unused, unworn, and in its original packaging. You pay the return shipping.",
        "Once the return arrives and passes inspection, the refund is sent to the original payment method.",
        "Custom-sized pieces are not returnable unless they are defective.",
      ],
    },
    privacy: {
      title: "Data privacy",
      body: [
        "We do not share your personal information with third parties, except where it is required to fulfil the order — for example with couriers such as DHL, FedEx, Aramex, and UPS.",
        "Checkout runs on secure, encrypted platforms. We do not store your payment details.",
        "Your name, phone, email, and address are used only to communicate about the order and to deliver it.",
        "We do not reuse your details for unsolicited marketing.",
      ],
    },
    terms: {
      title: "Other store policies",
      body: [
        "Orders can be cancelled within 12 hours of purchase. Once an order has been dispatched, it can no longer be cancelled.",
        "Leather colour can shift slightly from the photos because of lighting and screen settings.",
        "Custom sizing is available. Send a message before you buy. Custom items cannot be returned unless they are defective.",
        "Customer support replies within 24 hours, Monday to Saturday.",
      ],
    },
    other: {
      title: "Other store policies",
      body: [
        "Orders can be cancelled within 12 hours of purchase. Once an order has been dispatched, it can no longer be cancelled.",
        "Leather colour can shift slightly from the photos because of lighting and screen settings.",
        "Custom sizing is available. Send a message before you buy. Custom items cannot be returned unless they are defective.",
        "Customer support replies within 24 hours, Monday to Saturday.",
      ],
    },
    warranty: {
      title: "Warranty",
      body: [
        "Every item includes a 30-day limited warranty.",
        "The warranty covers manufacturing defects: stitching, zippers, and lining damage that is not caused by misuse.",
        "It does not cover normal wear, accidental damage, or damage from improper care.",
        "If you find a defect within 30 days, contact us with clear photos and a short description. We will arrange a satisfactory solution.",
      ],
    },
  };
}

export const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms", "other", "warranty"];

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

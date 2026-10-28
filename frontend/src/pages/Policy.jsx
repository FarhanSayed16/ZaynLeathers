import { Link, useParams } from "react-router-dom";
import { useContext, useMemo } from "react";
import SEO from "../components/SEO";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";

const FALLBACK_POLICIES = {
  shipping: {
    title: "Shipping policy",
    body: [
      `${brand.name} offers free expedited shipping worldwide on every order.`,
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
      `Need help with a return? Contact us at ${brand.contact.phone}. We reply within 24 hours, Monday to Saturday.`,
    ],
  },
  privacy: {
    title: "Data privacy",
    body: [
      "Your privacy matters. We do not share your personal information with third parties, except where it is required to fulfil the order — for example with couriers such as DHL, FedEx, Aramex, and UPS.",
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

const Policy = () => {
  const { slug } = useParams();
  const { settings } = useContext(ShopContext);

  const policy = useMemo(() => {
    const key = slug && FALLBACK_POLICIES[slug] ? slug : "other";
    const fromApi = settings?.policies?.[key];
    if (fromApi?.body?.length) {
      return {
        title: fromApi.title || FALLBACK_POLICIES[key].title,
        body: fromApi.body,
      };
    }
    return FALLBACK_POLICIES[key];
  }, [slug, settings?.policies]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SEO title={policy.title} description={policy.body[0]} />
      <Link to="/" className="text-sm text-tz-navy/55 hover:text-tz-navy">
        ← Home
      </Link>
      <h1 className="font-display text-3xl sm:text-4xl text-tz-navy mt-4 mb-6">{policy.title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-tz-navy/75">
        {policy.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <p className="text-sm mt-8">
        Questions? <Link to="/contact" className="underline font-semibold">Contact us</Link>
      </p>
    </div>
  );
};

export default Policy;

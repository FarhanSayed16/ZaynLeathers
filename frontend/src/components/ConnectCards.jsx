import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import brand from "../brand";

const whatsappHref = `${brand.contact.whatsappUrl || brand.social.whatsapp}?text=${encodeURIComponent(
  "Hi, I would like to place an order with Zayn Leathers."
)}`;

const cards = [
  {
    title: "eBay store",
    detail: "Top rated seller",
    figure: "15,000",
    caption: "Pieces sold · 99% positive",
    href: brand.social.ebay,
    cta: "Shop on eBay",
    mark: (
      <span className="text-3xl font-black tracking-tight">
        <span className="text-[#e53238]">e</span>
        <span className="text-[#0064d2]">b</span>
        <span className="text-[#f5af02]">a</span>
        <span className="text-[#86b817]">y</span>
      </span>
    ),
  },
  {
    title: "Instagram",
    detail: "New jackets and studio notes",
    figure: "4,300",
    caption: "Followers",
    href: brand.social.instagram,
    cta: "Follow",
    mark: <FaInstagram className="text-3xl text-tz-navy" />,
  },
  {
    title: "WhatsApp",
    detail: "Place an order in chat",
    figure: brand.contact.phone,
    caption: "Replies within 24 hours",
    href: whatsappHref,
    cta: "Message",
    mark: <FaWhatsapp className="text-3xl text-[#128C7E]" />,
  },
];

const ConnectCards = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
    <div className="text-center mb-8 sm:mb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-tz-navy/45">Find us</p>
      <h2 className="font-display text-3xl sm:text-4xl text-tz-navy mt-2">Shop, follow, or message</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <a
          key={card.title}
          href={card.href}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col border border-tz-navy/10 bg-white p-6 sm:p-7 min-h-[280px] hover:border-tz-navy transition-colors"
        >
          {card.mark}
          <h3 className="mt-6 font-display text-3xl text-tz-navy">{card.title}</h3>
          <p className="mt-1 text-sm text-tz-navy/60">{card.detail}</p>
          <p className="mt-6 font-display text-3xl sm:text-4xl text-tz-navy leading-none">{card.figure}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-tz-navy/45">{card.caption}</p>
          <span className="mt-auto pt-8 text-sm font-semibold uppercase tracking-[0.14em] text-tz-navy group-hover:underline underline-offset-4">
            {card.cta} →
          </span>
        </a>
      ))}
    </div>
  </section>
);

export default ConnectCards;

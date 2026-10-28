import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/Breadcrumbs";
import FaqList from "../components/FaqList";
import { FAQ_GROUPS, faqPlainText } from "../data/faq";
import brand from "../brand";

const Faq = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqPlainText().map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
    document.getElementById("faq-jsonld")?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="bg-tz-cream min-h-screen">
      <SEO
        title="FAQ"
        description="Answers about Zayn Leathers jackets, worldwide shipping, 30-day returns, and leather care."
      />
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "FAQ" }]} />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tz-navy/45">
            {brand.name}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl text-tz-navy mt-2">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-tz-navy/70 max-w-2xl">
            Shipping, returns, leather care, and how an order works. If your question is not here, write to us and we will reply within 24 hours, Monday to Saturday.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {FAQ_GROUPS.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border border-tz-navy/15 text-tz-navy hover:bg-tz-navy hover:text-white transition-colors"
              >
                {group.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <FaqList groups={FAQ_GROUPS} initialId="about-0" />
        <p className="mt-10 text-sm text-tz-navy/70">
          Still need help?{" "}
          <Link to="/contact" className="font-semibold text-tz-navy underline underline-offset-4">
            Contact us
          </Link>{" "}
          or call{" "}
          <a href={brand.contact.phoneHref} className="font-semibold text-tz-navy underline underline-offset-4">
            {brand.contact.phone}
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Faq;

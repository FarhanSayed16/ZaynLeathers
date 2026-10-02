import React, { useContext, useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaWhatsapp,
  FaClock,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/Breadcrumbs";
import * as shopApi from "../api/shopApi";

const Contact = () => {
  const { settings } = useContext(ShopContext);
  // Prefer brand WhatsApp on contact page; feature flag only for optional marketing widgets elsewhere
  const whatsappHref =
    brand.contact.whatsappUrl ||
    brand.social.whatsapp ||
    (settings?.features?.whatsapp ? brand.contact.whatsappUrl : "");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: "", message: "" });

    try {
      const data = await shopApi.submitContact(formData);
      if (data.success) {
        setFormStatus({ type: "success", message: data.message || "Message sent — we'll reply soon." });
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setFormStatus({ type: "error", message: data.message || "Something went wrong." });
      }
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message || "Something went wrong.",
      });
    }

    setIsSubmitting(false);
  };

  const fieldClass =
    "w-full border border-gray-200 bg-white px-4 py-3 text-sm text-tz-navy placeholder:text-tz-navy/35 focus:outline-none focus:border-tz-navy focus:ring-1 focus:ring-tz-navy/20 transition-colors";
  const labelClass =
    "block text-[11px] font-semibold uppercase tracking-[0.12em] text-tz-navy/55 mb-2";

  const channels = [
    brand.contact.email && {
      icon: FaEnvelope,
      label: "Email",
      value: brand.contact.email,
      href: `mailto:${brand.contact.email}`,
    },
    brand.contact.phone && {
      icon: FaPhone,
      label: "Phone",
      value: brand.contact.phone,
      href: brand.contact.phoneHref || `tel:${String(brand.contact.phone).replace(/\s/g, "")}`,
    },
    whatsappHref && {
      icon: FaWhatsapp,
      label: "WhatsApp",
      value: brand.contact.whatsapp || brand.contact.phone,
      href: whatsappHref,
      external: true,
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-tz-cream">
      <SEO
        title="Contact Us"
        description={`Get in touch with ${brand.name}. Email, phone, WhatsApp, or send a message.`}
      />

      {/* Compact page header */}
      <section className="border-b border-tz-navy/10 bg-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Contact Us" },
            ]}
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tz-navy/45 mt-1">
            {brand.name}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-tz-navy tracking-tight mt-1">
            Contact us
          </h1>
          <p className="mt-3 text-sm text-tz-navy/60 max-w-xl leading-relaxed">
            Questions about an order, sizing, or a custom jacket — we usually reply within 24 hours.
          </p>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-12 items-start">
          {/* Form */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 md:p-10">
            <h2 className="font-display text-2xl font-semibold text-tz-navy mb-1">
              Send a message
            </h2>
            <p className="text-sm text-tz-navy/55 mb-8">
              Fill in the form and our team will get back to you.
            </p>

            {formStatus.message ? (
              <div
                className={`mb-6 px-4 py-3 flex items-start gap-3 text-sm ${
                  formStatus.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-100"
                    : "bg-red-50 text-red-800 border border-red-100"
                }`}
                role="status"
              >
                {formStatus.type === "success" ? (
                  <FaCheckCircle size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <FaExclamationCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <p>{formStatus.message}</p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="contact-name">
                    Name <span className="text-tz-pink">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="contact-email">
                    Email <span className="text-tz-pink">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-phone">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="+91 …"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-message">
                  Message <span className="text-tz-pink">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`${fieldClass} resize-y min-h-[120px]`}
                  placeholder="How can we help?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-tz-navy text-white text-sm font-bold uppercase tracking-wide hover:bg-black transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send message
                    <FaPaperPlane size={12} aria-hidden />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="bg-white border border-gray-100 p-6 space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tz-navy/45">
                Reach us directly
              </p>
              <ul className="space-y-4">
                {channels.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <li key={ch.label}>
                      <a
                        href={ch.href}
                        target={ch.external ? "_blank" : undefined}
                        rel={ch.external ? "noopener noreferrer" : undefined}
                        className="flex gap-3 group"
                      >
                        <span className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-tz-cream text-tz-navy border border-tz-navy/10 group-hover:bg-tz-navy group-hover:text-white transition-colors">
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-wider text-tz-navy/45">
                            {ch.label}
                          </span>
                          <span className="block text-sm text-tz-navy group-hover:underline underline-offset-2 break-words">
                            {ch.value}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {brand.contact.address ? (
              <div className="bg-white border border-gray-100 p-6">
                <div className="flex gap-3">
                  <span className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-tz-cream text-tz-navy border border-tz-navy/10">
                    <FaMapMarkerAlt size={14} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tz-navy/45 mb-1">
                      Store
                    </p>
                    <p className="text-sm text-tz-navy/75 leading-relaxed">
                      {brand.contact.address}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {brand.contact.hours ? (
              <div className="bg-white border border-gray-100 p-6">
                <div className="flex gap-3">
                  <span className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-tz-cream text-tz-navy border border-tz-navy/10">
                    <FaClock size={14} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tz-navy/45 mb-1">
                      Hours
                    </p>
                    <p className="text-sm text-tz-navy/75">{brand.contact.hours}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-tz-navy text-white p-6">
              <p className="font-display text-xl font-semibold mb-2">Custom jacket?</p>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                Share fit, leather, and a reference — we craft made-to-order pieces.
              </p>
              <Link
                to="/custom-jackets"
                className="inline-flex text-sm font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white"
              >
                Start a custom request →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {brand.contact.mapEmbedUrl ? (
        <section className="w-full h-64 sm:h-80 border-t border-tz-navy/10 bg-gray-100">
          <iframe
            title={brand.contact.mapTitle || "Store location"}
            src={brand.contact.mapEmbedUrl}
            width="100%"
            height="100%"
            className="w-full h-full grayscale-[20%]"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      ) : null}
    </div>
  );
};

export default Contact;

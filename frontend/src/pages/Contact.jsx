import React, { useContext, useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
} from "react-icons/fa";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";
import SEO from "../components/SEO";
import * as shopApi from "../api/shopApi";

const Contact = () => {
  const { settings } = useContext(ShopContext);
  const whatsappFeatureOn = settings?.features?.whatsapp === true;
  const whatsappHref =
    whatsappFeatureOn && (brand.contact.whatsappUrl || brand.social.whatsapp);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await shopApi.submitContact(formData);

      if (data.success) {
        setFormStatus({ type: "success", message: data.message });
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setFormStatus({ type: "error", message: data.message || "Something went wrong!" });
      }
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message || "Something went wrong!",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-tz-cream relative overflow-hidden">
      <SEO title="Contact Us" description={`Get in touch with ${brand.name} support.`} />
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-tz-pink/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Centered Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 text-center relative z-10">
        <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-tz-pink mb-4">
          Get in touch
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-tz-navy tracking-tight mb-5">
          Contact <span className="text-tz-pink font-serif italic font-medium pr-2">Us</span>
        </h1>
        <p className="text-sm sm:text-base text-tz-navy/60 max-w-md mx-auto leading-relaxed">
          We'd love to hear from you. Send us a message and our team will get back to you as soon as possible.
        </p>
      </section>

      {/* Minimal Contact Info Row */}
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:pb-20 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {brand.contact.email && (
            <a href={`mailto:${brand.contact.email}`} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-tz-pink/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <FaEnvelope className="text-tz-pink" size={18} />
              </div>
              <h3 className="text-sm font-bold text-tz-navy mb-1 tracking-wide">Email</h3>
              <p className="text-sm text-tz-navy/60">{brand.contact.email}</p>
            </a>
          )}
          {brand.contact.phone && (
            <a href={brand.contact.phoneHref || `tel:${String(brand.contact.phone).replace(/\s/g, "")}`} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-tz-pink/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <FaPhone className="text-tz-pink" size={18} />
              </div>
              <h3 className="text-sm font-bold text-tz-navy mb-1 tracking-wide">Phone</h3>
              <p className="text-sm text-tz-navy/60">{brand.contact.phone}</p>
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center group"
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-tz-pink/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <FaWhatsapp className="text-tz-pink" size={18} />
              </div>
              <h3 className="text-sm font-bold text-tz-navy mb-1 tracking-wide">WhatsApp</h3>
              <p className="text-sm text-tz-navy/60">{brand.contact.phone}</p>
            </a>
          )}
          {brand.contact.address && (
            <div className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-tz-pink/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <FaMapMarkerAlt className="text-tz-pink" size={18} />
              </div>
              <h3 className="text-sm font-bold text-tz-navy mb-1 tracking-wide">Store</h3>
              <p className="text-sm text-tz-navy/60 max-w-[180px]">{brand.contact.address}</p>
            </div>
          )}
        </div>
        {(brand.social.instagram || brand.social.facebook) && (
          <div className="flex justify-center gap-3 mt-10">
            {brand.social.instagram && (
              <a
                href={brand.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-tz-pink/15 flex items-center justify-center text-tz-navy hover:text-tz-pink"
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>
            )}
            {brand.social.facebook && (
              <a
                href={brand.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-tz-pink/15 flex items-center justify-center text-tz-navy hover:text-tz-pink"
                aria-label="Facebook"
              >
                <FaFacebookF size={16} />
              </a>
            )}
          </div>
        )}
      </section>

      {/* Centered Form Section */}
      <section className="px-4 pb-20 sm:pb-28 relative z-10">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white p-6 sm:p-10 md:p-12 relative overflow-hidden">
          {/* Subtle interior glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-tz-pink/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <h2 className="text-2xl font-bold text-tz-navy mb-2">Send Message</h2>
            <p className="text-sm text-tz-navy/60">Fill out the form below and we'll reply within 24 hours.</p>
          </div>

          {formStatus.message && (
            <div className={`mb-8 p-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium relative z-10 ${
              formStatus.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-100" 
                : "bg-red-50 text-red-700 border border-red-100"
            }`}>
              {formStatus.type === "success" 
                ? <FaCheckCircle size={16} className="shrink-0" />
                : <FaExclamationCircle size={16} className="shrink-0" />
              }
              <p>{formStatus.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-tz-navy/50 mb-2 ml-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-tz-pink/10 focus:border-tz-pink transition-all text-sm outline-none bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-tz-navy/50 mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-tz-pink/10 focus:border-tz-pink transition-all text-sm outline-none bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-tz-navy/50 mb-2 ml-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-tz-pink/10 focus:border-tz-pink transition-all text-sm outline-none bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-tz-navy/50 mb-2 ml-1">Your Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-5 py-4 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-tz-pink/10 focus:border-tz-pink transition-all text-sm outline-none resize-none bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm"
                placeholder="How can we help you?"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-tz-navy text-white hover:bg-tz-navy/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-tz-navy/20 transition-all duration-300 py-4 rounded-2xl font-bold text-sm tracking-wide disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Message</span>
                  <FaPaperPlane size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Sleek Map Banner */}
      {brand.contact.mapEmbedUrl && (
        <section className="w-full h-72 sm:h-96 relative bg-gray-50 z-10">
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_4px_20px_rgba(0,0,0,0.03)] z-10" />
          <iframe
            title={`Google Map - ${brand.contact.mapTitle}`}
            src={brand.contact.mapEmbedUrl}
            width="100%"
            height="100%"
            className="w-full h-full object-cover filter grayscale-[0.2] contrast-[0.95] opacity-90 hover:opacity-100 transition-opacity duration-700"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          />
        </section>
      )}
    </div>
  );
};

export default Contact;

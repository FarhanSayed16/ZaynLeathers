import React, { useContext } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp } from "react-icons/fa";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";

const iconBtn =
  "w-9 h-9 inline-flex items-center justify-center border border-white/15 text-white/80 hover:bg-white hover:text-tz-navy transition-colors";

const Footer = () => {
  const { settings } = useContext(ShopContext);
  const whatsappFeatureOn = settings?.features?.whatsapp === true;
  const phoneHref =
    brand.contact.phoneHref ||
    `tel:${String(brand.contact.phone || "").replace(/\s/g, "")}`;
  const whatsappHref =
    brand.contact.whatsappUrl ||
    brand.social.whatsapp ||
    (whatsappFeatureOn ? brand.contact.whatsappUrl : "");
  const mailHref = brand.contact.email ? `mailto:${brand.contact.email}` : "";

  const shopLinks = [
    { to: "/shop", label: "Shop all" },
    { to: "/shop?department=men", label: "Men" },
    { to: "/shop?department=women", label: "Women" },
    { to: "/shop?department=bags", label: "Bags" },
    { to: "/shop?sort=newest", label: "New arrivals" },
    { to: "/custom-jackets", label: "Custom jackets" },
  ];

  const helpLinks = [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/shipping-policy", label: "Shipping" },
    { to: "/return-refund", label: "Returns" },
    { to: "/privacy", label: "Privacy" },
    { to: "/terms", label: "Terms" },
  ];

  return (
    <footer className="bg-tz-navy text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block">
              <img
                className="h-9 w-auto object-contain brightness-0 invert opacity-95"
                src={brand.logos.footer}
                alt={brand.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Link>
            <p className="text-sm text-white/55 mt-4 leading-relaxed max-w-sm">
              {brand.footer.blurb}
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {brand.social.instagram ? (
                <a
                  href={brand.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="Instagram"
                >
                  <FaInstagram size={13} />
                </a>
              ) : null}
              {brand.social.facebook ? (
                <a
                  href={brand.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="Facebook"
                >
                  <FaFacebookF size={13} />
                </a>
              ) : null}
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={13} />
                </a>
              ) : null}
              {brand.social.twitter ? (
                <a
                  href={brand.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="Twitter"
                >
                  <FaTwitter size={13} />
                </a>
              ) : null}
              {brand.social.linkedin ? (
                <a
                  href={brand.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn size={13} />
                </a>
              ) : null}
            </div>
          </div>

          {/* Shop */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Shop
            </h3>
            <ul className="text-sm text-white/55 space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Help
            </h3>
            <ul className="text-sm text-white/55 space-y-2.5">
              {helpLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Contact
            </h3>
            <ul className="space-y-4 text-sm text-white/55">
              {brand.contact.phone ? (
                <li>
                  <a
                    href={phoneHref}
                    className="flex items-start gap-3 hover:text-white transition-colors"
                  >
                    <FaPhoneAlt className="shrink-0 mt-1 text-white/40" size={12} />
                    <span>{brand.contact.phone}</span>
                  </a>
                </li>
              ) : null}
              {brand.contact.email ? (
                <li>
                  <a
                    href={mailHref}
                    className="flex items-start gap-3 hover:text-white transition-colors break-all"
                  >
                    <FaEnvelope className="shrink-0 mt-1 text-white/40" size={12} />
                    <span>{brand.contact.email}</span>
                  </a>
                </li>
              ) : null}
              {brand.contact.address ? (
                <li className="flex items-start gap-3">
                  <FaMapMarkerAlt className="shrink-0 mt-1 text-white/40" size={12} />
                  <span className="leading-relaxed max-w-xs">{brand.contact.address}</span>
                </li>
              ) : null}
              {whatsappHref ? (
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white hover:underline underline-offset-4"
                  >
                    <FaWhatsapp size={14} />
                    Chat on WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>
            © {brand.footer.copyrightYear} {brand.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/shipping-policy" className="hover:text-white transition-colors">
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

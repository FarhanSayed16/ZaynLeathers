import React, { useContext } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp } from "react-icons/fa";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";

const iconBtn =
  "w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-tz-pink transition-colors";

const Footer = () => {
  const { settings } = useContext(ShopContext);
  const whatsappFeatureOn = settings?.features?.whatsapp === true;
  const phoneHref = brand.contact.phoneHref || `tel:${String(brand.contact.phone || "").replace(/\s/g, "")}`;
  const whatsappHref =
    whatsappFeatureOn && (brand.contact.whatsappUrl || brand.social.whatsapp);
  const mailHref = brand.contact.email ? `mailto:${brand.contact.email}` : "";

  const contactItems = [
    brand.contact.phone && {
      icon: FaPhoneAlt,
      text: brand.contact.phone,
      href: phoneHref,
    },
    brand.contact.email && {
      icon: FaEnvelope,
      text: brand.contact.email,
      href: mailHref,
    },
    brand.contact.address && {
      icon: FaMapMarkerAlt,
      text: brand.contact.address,
    },
    whatsappHref && {
      icon: FaWhatsapp,
      text: "Chat on WhatsApp",
      href: whatsappHref,
    },
  ].filter(Boolean);

  return (
    <footer className="bg-tz-navy text-white pt-12 pb-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-10 lg:gap-14">
        <div>
          <Link to="/" className="inline-block">
            <img
              className="h-10 w-auto object-contain brightness-0 invert opacity-95"
              src={brand.logos.footer}
              alt={brand.name}
            />
          </Link>
          <p className="text-sm text-white/60 mt-4 leading-relaxed max-w-sm">
            {brand.footer.blurb}
          </p>
          <div className="flex gap-2 mt-5">
            {brand.social.instagram && (
              <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Instagram">
                <FaInstagram size={12} />
              </a>
            )}
            {brand.social.facebook && (
              <a href={brand.social.facebook} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Facebook">
                <FaFacebookF size={12} />
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="WhatsApp">
                <FaWhatsapp size={12} />
              </a>
            )}
            {brand.social.twitter && (
              <a href={brand.social.twitter} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Twitter">
                <FaTwitter size={12} />
              </a>
            )}
            {brand.social.linkedin && (
              <a href={brand.social.linkedin} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="LinkedIn">
                <FaLinkedinIn size={12} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-white/80">Explore</h3>
          <ul className="mt-4 text-sm text-white/55 space-y-2.5">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Shop</Link></li>
            <li><Link to="/shop?department=men" className="hover:text-white transition-colors">Men</Link></li>
            <li><Link to="/shop?department=women" className="hover:text-white transition-colors">Women</Link></li>
            <li><Link to="/shop?department=bags" className="hover:text-white transition-colors">Bags</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link></li>
            <li><Link to="/return-refund" className="hover:text-white transition-colors">Returns</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-white/80">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/55">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const body = (
                <>
                  <Icon className="text-tz-pink shrink-0 mt-0.5" size={12} />
                  <span>{item.text}</span>
                </>
              );
              return (
                <li key={item.text}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="flex items-start gap-3 hover:text-white transition-colors"
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {body}
                    </a>
                  ) : (
                    <span className="flex items-start gap-3">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto text-center text-white/35 text-xs mt-10 pt-5 border-t border-white/10">
        © {brand.footer.copyrightYear} {brand.name}. All rights reserved.
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-white">Privacy</Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-white">Terms</Link>
      </div>
    </footer>
  );
};

export default Footer;

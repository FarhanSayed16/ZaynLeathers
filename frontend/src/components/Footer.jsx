import React, { useContext, useState } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaPinterestP } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";
import * as shopApi from "../api/shopApi";

const iconBtn =
  "w-9 h-9 inline-flex items-center justify-center border border-white/15 text-white/80 hover:bg-white hover:text-tz-navy transition-colors";

const STATS = [
  { value: "15,000", label: "Pieces sold" },
  { value: "2015", label: "House established" },
  { value: "Worldwide", label: "Free expedited shipping" },
  { value: "99%", label: "Positive feedback" },
];

const Footer = () => {
  const { settings } = useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const whatsappFeatureOn = settings?.features?.whatsapp === true;
  const phoneHref =
    brand.contact.phoneHref ||
    `tel:${String(brand.contact.phone || "").replace(/\s/g, "")}`;
  const whatsappHref =
    brand.contact.whatsappUrl ||
    brand.social.whatsapp ||
    (whatsappFeatureOn ? brand.contact.whatsappUrl : "");
  const mailHref = brand.contact.email ? `mailto:${brand.contact.email}` : "";

  const hidden = new Set(
    (brand.catalog?.hiddenDepartments || []).map((item) => String(item).toLowerCase())
  );
  const shopLinks = [
    { to: "/shop", label: "Shop all" },
    { to: "/shop?department=men", label: "Men" },
    { to: "/shop?department=women", label: "Women" },
    { to: "/shop?department=accessories", label: "Accessories" },
    { to: "/shop?category=movie-jackets", label: "Movie jackets" },
    { to: "/custom-jackets", label: "Custom jackets" },
  ].filter((link) => {
    const dept = new URLSearchParams(link.to.split("?")[1] || "").get("department");
    return !(dept && hidden.has(dept.toLowerCase()));
  });

  const helpLinks = [
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
    { to: "/shipping-policy", label: "Shipping" },
    { to: "/return-refund", label: "Returns" },
    { to: "/privacy", label: "Privacy" },
    { to: "/policy/other", label: "Other policies" },
    { to: "/policy/warranty", label: "Warranty" },
  ];

  const subscribe = async (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubscribing(true);
    try {
      const res = await shopApi.subscribeNewsletter({ email: trimmed });
      if (res?.success === false) {
        toast.error(res.message || "Could not subscribe");
        return;
      }
      setEmail("");
      toast.success(res?.message || "You're on the list.");
    } catch (err) {
      toast.error(err.message || "Could not subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="mt-auto">
      <div className="bg-[#f6f5f3] border-t border-black/5">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-2 lg:grid-cols-4 gap-y-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center px-3">
              <p className="font-display text-4xl sm:text-5xl text-tz-navy leading-none">{stat.value}</p>
              <p className="mt-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-tz-navy/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-tz-navy text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="col-span-2 md:col-span-1 text-center md:text-left">
            <Link to="/" className="inline-flex justify-center md:justify-start">
              <img
                className="h-12 w-auto object-contain"
                src={brand.logos.footer}
                alt={brand.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Link>
            <p className="text-sm text-white/55 mt-4 leading-relaxed max-w-sm mx-auto md:mx-0">
              {brand.footer.blurb}
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
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
                  aria-label="X"
                >
                  <FaTwitter size={13} />
                </a>
              ) : null}
              {brand.social.pinterest ? (
                <a
                  href={brand.social.pinterest}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="Pinterest"
                >
                  <FaPinterestP size={13} />
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

          <div>
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

          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Brand
            </h3>
            <ul className="text-sm text-white/55 space-y-2.5">
              <li><Link to="/about" className="hover:text-white">Our story</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/reviews" className="hover:text-white">Reviews</Link></li>
              <li><Link to="/custom-jackets" className="hover:text-white">Custom jackets</Link></li>
              {brand.social.ebay ? (
                <li>
                  <a href={brand.social.ebay} target="_blank" rel="noreferrer" className="hover:text-white">
                    eBay store
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Help
            </h3>
            <ul className="text-sm text-white/55 space-y-2.5">
              {helpLinks.filter((link) => link.to !== "/about" && link.to !== "/faq").map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1 text-center md:text-left">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4">
              Stay in touch
            </h3>
            <p className="text-sm text-white/55 mb-4">New jackets and offers. No unrelated mail.</p>
            <form onSubmit={subscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter email"
                className="bg-white text-tz-navy text-sm px-3 py-2.5 outline-none"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-white/10 border border-white/20 py-2.5 text-sm font-semibold hover:bg-white hover:text-tz-navy disabled:opacity-60"
              >
                {subscribing ? "Sending…" : "Sign up"}
              </button>
            </form>
            <ul className="mt-5 space-y-2 text-sm text-white/55">
              {brand.contact.phone ? (
                <li>
                  <a href={phoneHref} className="inline-flex items-center gap-2 hover:text-white">
                    <FaPhoneAlt size={11} /> {brand.contact.phone}
                  </a>
                </li>
              ) : null}
              {brand.contact.email ? (
                <li>
                  <a href={mailHref} className="inline-flex items-center gap-2 hover:text-white break-all">
                    <FaEnvelope size={11} /> {brand.contact.email}
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
            <Link to="/policy/other" className="hover:text-white transition-colors">
              Policies
            </Link>
            <Link to="/policy/warranty" className="hover:text-white transition-colors">
              Warranty
            </Link>
            <Link to="/shipping-policy" className="hover:text-white transition-colors">
              Shipping
            </Link>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;

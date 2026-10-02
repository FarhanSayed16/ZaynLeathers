import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaWhatsapp,
  FaUpload,
  FaRulerCombined,
  FaComments,
  FaHammer,
} from "react-icons/fa";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/Breadcrumbs";
import brand from "../brand";
import * as shopApi from "../api/shopApi";

const STYLE_OPTIONS = [
  {
    id: "Biker",
    label: "Biker",
    blurb: "Asymmetric zip, belt, attitude",
    image: "/brand/heroes/hero-1.webp",
  },
  {
    id: "Bomber",
    label: "Bomber",
    blurb: "Rib knit, clean silhouette",
    image: "/brand/lifestyle/leather-blazer.jpg",
  },
  {
    id: "Varsity",
    label: "Varsity",
    blurb: "Contrast sleeves, collegiate",
    image: "/brand/heroes/hero-2.jpg",
  },
  {
    id: "Aviator",
    label: "Aviator",
    blurb: "Shearling collar, flight cut",
    image: "/brand/heroes/hero-4.webp",
  },
  {
    id: "Movie",
    label: "Movie",
    blurb: "Replica from a still or sketch",
    image: "/brand/lifestyle/leather-backpack.jpg",
  },
  {
    id: "Other",
    label: "Other",
    blurb: "Tell us in the description",
    image: "/brand/heroes/hero-3.webp",
  },
];

const STEPS = [
  {
    icon: FaComments,
    title: "Share your vision",
    text: "Style, leather, colour, and a reference photo if you have one.",
  },
  {
    icon: FaRulerCombined,
    title: "We confirm fit & quote",
    text: "Sizing, price, and timeline — nothing starts until you approve.",
  },
  {
    icon: FaHammer,
    title: "Crafted to order",
    text: "Handmade in leather. Updates when your piece is underway.",
  },
];

const MAX_FILE_MB = 8;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  quantity: 1,
  gender: "Male",
  country: "India",
  description: "",
};

const CustomJackets = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [styles, setStyles] = useState([]);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const whatsappHref = brand.contact.whatsappUrl || brand.social.whatsapp;
  const heroImage =
    brand.media?.heroes?.[0]?.image ||
    "/brand/heroes/hero-1.webp";

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStyle = (style) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const acceptFile = (next, inputEl) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(next.type)) {
      toast.error("Upload a JPG, PNG, WEBP, or PDF file");
      if (inputEl) inputEl.value = "";
      return;
    }
    if (next.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_MB}MB`);
      if (inputEl) inputEl.value = "";
      return;
    }
    setFile(next);
  };

  const onFile = (e) => {
    acceptFile(e.target.files?.[0], e.target);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const descriptionWithStyles = useMemo(() => {
    if (!styles.length) return form.description.trim();
    const prefix = `Preferred styles: ${styles.join(", ")}.`;
    return form.description.trim()
      ? `${prefix}\n\n${form.description.trim()}`
      : prefix;
  }, [styles, form.description]);

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Valid email is required";
    }
    if (!form.phone.trim()) return "Phone number is required";
    if (!form.quantity || Number(form.quantity) < 1) return "Quantity must be at least 1";
    if (!form.country.trim()) return "Country is required";
    if (!descriptionWithStyles) return "Please describe what you need";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        description: descriptionWithStyles,
        styles,
        file,
      };
      const res = await shopApi.submitCustomJacket(payload);
      if (res?.success === false) {
        toast.error(res.message || "Could not submit request");
        return;
      }
      setSubmitted(true);
      toast.success(res?.message || "Request submitted");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error.message || "Something went wrong — try again");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setStyles([]);
    setFile(null);
    setSubmitted(false);
  };

  const fieldClass =
    "w-full border border-gray-200 bg-white px-4 py-3 text-sm text-tz-navy placeholder:text-tz-navy/35 focus:outline-none focus:border-tz-navy focus:ring-1 focus:ring-tz-navy/20 transition-colors";
  const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-tz-navy/55 mb-2";

  if (submitted) {
    return (
      <div className="min-h-screen bg-tz-cream">
        <SEO title="Custom Leather Jackets" description={`Request received — ${brand.name}`} />
        <div className="max-w-lg mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-tz-navy text-white flex items-center justify-center">
            <FaCheck size={22} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tz-navy/45 mb-3">
            Request received
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-tz-navy mb-4">
            We&apos;ll be in touch
          </h1>
          <p className="text-sm text-tz-navy/60 leading-relaxed mb-10">
            Our team will review your custom jacket brief and reply within{" "}
            <strong className="text-tz-navy font-semibold">24–48 hours</strong> at{" "}
            <span className="text-tz-navy">{form.email}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-tz-navy text-white text-sm font-semibold hover:bg-black transition-colors"
              >
                <FaWhatsapp size={16} /> Chat on WhatsApp
              </a>
            ) : null}
            <Link
              to="/shop"
              className="inline-flex justify-center px-7 py-3.5 border border-tz-navy/25 text-tz-navy text-sm font-semibold hover:border-tz-navy transition-colors"
            >
              Continue shopping
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex justify-center px-7 py-3.5 text-sm font-semibold text-tz-navy/55 hover:text-tz-navy"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tz-cream">
      <SEO
        title="Custom Leather Jackets"
        description={`Design a made-to-order leather jacket with ${brand.name}. Upload references and tell us your fit, colour, and details.`}
      />

      {/* Hero — one composition */}
      <section className="relative min-h-[58vh] sm:min-h-[64vh] flex items-end overflow-hidden bg-tz-navy">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          onError={(e) => {
            e.currentTarget.src = brand.media.placeholder;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tz-navy via-tz-navy/55 to-tz-navy/20" />
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 pt-24">
          <Breadcrumbs
            tone="light"
            items={[
              { label: "Home", to: "/" },
              { label: "Custom Leather Jackets" },
            ]}
          />
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
            {brand.name} · Made to order
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight max-w-xl leading-[1.05]">
            Custom Leather Jackets
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/75 max-w-md leading-relaxed">
            Your fit, leather, and details — crafted once you approve the quote.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex px-7 py-3.5 bg-white text-tz-navy text-sm font-bold uppercase tracking-wide hover:bg-tz-cream transition-colors"
            >
              Start your request
            </button>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <FaWhatsapp size={15} /> WhatsApp us
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-tz-navy/10 bg-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tz-navy/45 mb-2">
            How it works
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tz-navy mb-8 sm:mb-10">
            Three steps to your jacket
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8 sm:gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 inline-flex items-center justify-center bg-tz-navy text-white">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="text-[11px] font-bold tabular-nums text-tz-navy/35">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-tz-navy mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-tz-navy/60 leading-relaxed">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Form section */}
      <section
        ref={formRef}
        id="custom-request"
        className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-28"
      >
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-12 items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tz-navy/45 mb-2">
              Request form
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tz-navy mb-2">
              Tell us what to build
            </h2>
            <p className="text-sm text-tz-navy/55 mb-8 max-w-xl">
              Pick a style direction, add your details, and drop a reference if you have one.
            </p>

            {/* Style cards */}
            <div className="mb-10">
              <p className={labelClass}>Preferred style</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((opt) => {
                  const on = styles.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleStyle(opt.id)}
                      aria-pressed={on}
                      className={`group relative text-left overflow-hidden border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tz-navy ${
                        on
                          ? "border-tz-navy ring-1 ring-tz-navy"
                          : "border-gray-200 hover:border-tz-navy/40"
                      }`}
                    >
                      <div className="aspect-[5/3] bg-gray-100 overflow-hidden">
                        <img
                          src={opt.image}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = brand.media.placeholder;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-white">
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-white/75 leading-snug hidden sm:block">
                            {opt.blurb}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 w-5 h-5 border flex items-center justify-center ${
                            on
                              ? "bg-white border-white text-tz-navy"
                              : "border-white/70 text-transparent"
                          }`}
                          aria-hidden
                        >
                          <FaCheck size={10} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {styles.length > 0 && (
                <p className="mt-2 text-xs text-tz-navy/50">
                  Selected: {styles.join(", ")}
                </p>
              )}
            </div>

            <form onSubmit={onSubmit} className="space-y-8" noValidate>
              <fieldset>
                <legend className="font-display text-xl font-semibold text-tz-navy mb-4">
                  Your details
                </legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="cj-name">
                      Name <span className="text-tz-pink">*</span>
                    </label>
                    <input
                      id="cj-name"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                      className={fieldClass}
                      autoComplete="name"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="cj-email">
                      Email <span className="text-tz-pink">*</span>
                    </label>
                    <input
                      id="cj-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      required
                      className={fieldClass}
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="cj-phone">
                      Phone <span className="text-tz-pink">*</span>
                    </label>
                    <input
                      id="cj-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      required
                      className={fieldClass}
                      autoComplete="tel"
                      placeholder="+91 …"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="cj-company">
                      Company
                    </label>
                    <input
                      id="cj-company"
                      name="company"
                      value={form.company}
                      onChange={onChange}
                      className={fieldClass}
                      autoComplete="organization"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-semibold text-tz-navy mb-4">
                  Order details
                </legend>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="cj-qty">
                      Quantity <span className="text-tz-pink">*</span>
                    </label>
                    <input
                      id="cj-qty"
                      type="number"
                      name="quantity"
                      min={1}
                      max={999}
                      value={form.quantity}
                      onChange={onChange}
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="cj-gender">
                      Fit / gender <span className="text-tz-pink">*</span>
                    </label>
                    <select
                      id="cj-gender"
                      name="gender"
                      value={form.gender}
                      onChange={onChange}
                      className={fieldClass}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Unisex / Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="cj-country">
                      Country <span className="text-tz-pink">*</span>
                    </label>
                    <input
                      id="cj-country"
                      name="country"
                      value={form.country}
                      onChange={onChange}
                      required
                      className={fieldClass}
                      autoComplete="country-name"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-semibold text-tz-navy mb-4">
                  Design notes
                </legend>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="cj-file">
                      Reference photo or sketch
                    </label>
                    <label
                      htmlFor="cj-file"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 border border-dashed px-5 py-6 cursor-pointer transition-colors ${
                        dragOver
                          ? "border-tz-navy bg-white"
                          : "border-gray-300 bg-white/60 hover:border-tz-navy/50"
                      }`}
                    >
                      <span className="w-11 h-11 shrink-0 inline-flex items-center justify-center bg-tz-navy text-white">
                        <FaUpload size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-tz-navy">
                          {file ? file.name : "Drop a file here or click to browse"}
                        </span>
                        <span className="block text-xs text-tz-navy/45 mt-0.5">
                          JPG, PNG, WEBP or PDF · max {MAX_FILE_MB}MB
                        </span>
                      </span>
                      <input
                        id="cj-file"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                        onChange={onFile}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="cj-desc">
                      Description <span className="text-tz-pink">*</span>
                    </label>
                    <textarea
                      id="cj-desc"
                      name="description"
                      value={form.description}
                      onChange={onChange}
                      required
                      rows={6}
                      placeholder="Leather type, colour, chest/length measurements, hardware, lining, delivery timeline…"
                      className={`${fieldClass} resize-y min-h-[140px]`}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center items-center px-10 py-3.5 bg-tz-navy text-white text-sm font-bold uppercase tracking-wide hover:bg-black transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
                <Link
                  to="/shop?department=men"
                  className="inline-flex justify-center items-center px-8 py-3.5 border border-tz-navy/20 text-sm font-semibold text-tz-navy hover:border-tz-navy transition-colors"
                >
                  Browse ready-to-wear
                </Link>
              </div>
            </form>
          </div>

          {/* Sticky aside */}
          <aside className="lg:sticky lg:top-28 space-y-5">
            <div className="bg-white border border-gray-100 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-tz-navy/45 mb-3">
                What happens next
              </p>
              <ul className="space-y-3 text-sm text-tz-navy/70">
                <li className="flex gap-2.5">
                  <FaCheck className="shrink-0 mt-1 text-tz-navy" size={12} />
                  Reply within 24–48 hours
                </li>
                <li className="flex gap-2.5">
                  <FaCheck className="shrink-0 mt-1 text-tz-navy" size={12} />
                  Quote & timeline before production
                </li>
                <li className="flex gap-2.5">
                  <FaCheck className="shrink-0 mt-1 text-tz-navy" size={12} />
                  Genuine leather, custom sizing
                </li>
                <li className="flex gap-2.5">
                  <FaCheck className="shrink-0 mt-1 text-tz-navy" size={12} />
                  Bulk / brand orders welcome
                </li>
              </ul>
            </div>

            <div className="bg-tz-navy text-white p-6">
              <p className="font-display text-xl font-semibold mb-2">Prefer to talk?</p>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                Send measurements or a still — we&apos;ll help refine the brief.
              </p>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white"
                >
                  <FaWhatsapp size={15} /> {brand.contact.whatsapp || "WhatsApp"}
                </a>
              ) : (
                <a
                  href={`mailto:${brand.contact.email}`}
                  className="inline-flex text-sm font-semibold underline underline-offset-4"
                >
                  {brand.contact.email}
                </a>
              )}
            </div>

            <div className="aspect-[3/4] overflow-hidden border border-gray-100 bg-gray-100 hidden lg:block">
              <img
                src="/brand/lifestyle/leather-blazer.jpg"
                alt="Leather jacket detail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = brand.media.placeholder;
                }}
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default CustomJackets;

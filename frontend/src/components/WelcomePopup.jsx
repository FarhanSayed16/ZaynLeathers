import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import brand from "../brand";
import * as shopApi from "../api/shopApi";

const STORAGE_KEY = "zayn_welcome_popup_v1";
const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/place-order",
];

/**
 * Phase D — first-visit welcome / gift capture popup.
 * Split layout: lifestyle image | form (reference: Popup_at_start).
 */
const WelcomePopup = () => {
  const location = useLocation();
  const titleId = useId();
  const emailRef = useRef(null);
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState("female");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const cfg = brand.popup || {};
  const enabled = cfg.enabled !== false;

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;
    if (localStorage.getItem(STORAGE_KEY)) return undefined;
    if (AUTH_PATHS.some((p) => location.pathname.startsWith(p))) return undefined;

    const delay = Number(cfg.delayMs) || 1800;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [enabled, cfg.delayMs, location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => emailRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusable).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await shopApi.subscribeNewsletter({ email: trimmed, gender });
      if (res?.success === false) {
        toast.error(res.message || "Could not subscribe");
        return;
      }
      setDone(true);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      toast.success(res?.message || "You're on the list!");
      setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      toast.error(err.message || "Something went wrong — try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const imageSrc =
    cfg.image ||
    brand.media?.lifestyle?.[0] ||
    brand.media?.heroes?.[0]?.image ||
    brand.media?.instagramFallback?.[0] ||
    brand.media?.placeholder;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={dismiss}
      />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-[860px] max-h-[92vh] overflow-y-auto bg-white shadow-2xl grid grid-cols-1 md:grid-cols-2 animate-[popupIn_0.28s_ease-out] sm:max-h-[90vh]"
        style={{
          animation: "popupIn 0.28s ease-out",
        }}
      >
        {/* Left visual */}
        <div className="relative min-h-[200px] md:min-h-[420px] bg-tz-navy overflow-hidden">
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = brand.media.placeholder;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6">
            <p className="text-white/90 text-xs font-semibold tracking-[0.18em] uppercase">
              {brand.name}
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="relative flex flex-col justify-center px-6 sm:px-10 py-8 sm:py-10 text-center">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center text-tz-navy/50 hover:text-tz-navy"
          >
            <FaTimes size={16} />
          </button>

          {done ? (
            <div className="py-8">
              <p className="text-sm font-semibold text-tz-navy mb-2">You're in</p>
              <h2 id={titleId} className="font-display text-2xl sm:text-3xl font-semibold text-tz-navy mb-3">
                Check your inbox
              </h2>
              <p className="text-sm text-tz-navy/60">
                {cfg.successMessage ||
                  "We'll send your welcome offer shortly. Happy shopping."}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-tz-navy/70">
                {cfg.eyebrow || "Welcome gift"}
              </p>
              <h2
                id={titleId}
                className="font-display text-2xl sm:text-[1.85rem] font-semibold text-tz-navy leading-snug"
              >
                {cfg.headline || "₹500 off your first leather piece"}
              </h2>
              <p className="text-sm text-tz-navy/55 leading-relaxed">
                {cfg.subcopy ||
                  "Enter your email for an exclusive code. Offer valid while supplies last."}
              </p>

              <fieldset className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-1">
                <legend className="sr-only">Gender</legend>
                {[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "other", label: "Other" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-2 text-sm text-tz-navy cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={gender === opt.value}
                      onChange={() => setGender(opt.value)}
                      className="w-4 h-4 text-tz-navy border-gray-300 focus:ring-tz-navy"
                    />
                    {opt.label}
                  </label>
                ))}
              </fieldset>

              <label className="block text-left">
                <span className="sr-only">Email address</span>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  autoComplete="email"
                  aria-invalid={email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  className="w-full border border-gray-300 px-4 py-3 text-sm text-center text-tz-navy placeholder:text-tz-navy/35 focus:outline-none focus:border-tz-navy"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-tz-navy text-white py-3.5 px-4 hover:bg-black transition-colors disabled:opacity-60"
              >
                <span className="block text-sm font-bold uppercase tracking-wide">
                  {submitting
                    ? "Unlocking…"
                    : cfg.ctaPrimary || "Unlock your offer"}
                </span>
                <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                  {cfg.ctaSecondary || "when you sign up for emails"}
                </span>
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-tz-navy/45 hover:text-tz-navy underline-offset-2 hover:underline"
              >
                No thanks
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="popupIn"] { animation: none !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
};

export default WelcomePopup;

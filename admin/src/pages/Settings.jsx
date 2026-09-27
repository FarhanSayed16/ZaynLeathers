import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import brand from "../brand";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";
import CategoryTilesEditor from "../components/CategoryTilesEditor";

const TABS = [
  { id: "commerce", label: "Commerce" },
  { id: "homepage", label: "Homepage" },
  { id: "tiles", label: "Category tiles" },
  { id: "featured", label: "Featured" },
  { id: "promo", label: "Announcement" },
  { id: "policies", label: "Policies" },
  { id: "invoices", label: "Invoices & tax" },
];

const POLICY_KEYS = [
  { key: "shipping", label: "Shipping", preview: "/policy/shipping" },
  { key: "returns", label: "Returns & refunds", preview: "/policy/returns" },
  { key: "privacy", label: "Privacy", preview: "/policy/privacy" },
  { key: "terms", label: "Terms", preview: "/policy/terms" },
];

const defaultSettings = {
  deliveryFee: 50,
  freeShippingThreshold: 999,
  codEnabled: true,
  partialPayment: {
    active: true,
    percent: 20,
    label: "Pay advance now, rest on delivery",
    policyNotice:
      "Paying an advance now reserves your order and helps cover logistics. If the parcel is refused or returned undelivered, the advance may be retained as per our policy. The remaining amount is payable only on successful delivery.",
    replaceCod: true,
    keepAdvanceOnRto: true,
    minAdvanceAmount: 50,
  },
  homeConfig: {
    showHero: true,
    showCategories: true,
    showNewArrivals: true,
    showBestSellers: true,
    showInstagram: true,
    showReviews: true,
    newArrivalsTitle: "NEW ARRIVALS",
    bestSellersTitle: "TOP BEST SELLERS",
    featuredProductIds: [],
  },
  categoryTiles: [
    {
      label: "Men",
      link: "/shop?department=men",
      image: brand.media?.categories?.men || "/brand/categories/men.svg",
      order: 0,
    },
    {
      label: "Women",
      link: "/shop?department=women",
      image: brand.media?.categories?.women || "/brand/categories/women.svg",
      order: 1,
    },
    {
      label: "Bags",
      link: "/shop?department=bags",
      image: brand.media?.categories?.bags || "/brand/categories/bags.svg",
      order: 2,
    },
    {
      label: "Accessories",
      link: "/shop?department=accessories",
      image: brand.media?.categories?.accessories || "/brand/categories/accessories.svg",
      order: 3,
    },
  ],
  promoStrip: {
    isActive: true,
    message: "FREE SHIPPING ON ORDERS OVER ₹999 — ZAYN LEATHERS",
    link: "/shop",
  },
  aboutConfig: {
    heroVideo: "",
  },
  policies: {},
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shippingOn, setShippingOn] = useState(false);
  const [moduleFeatures, setModuleFeatures] = useState({});
  const [invoiceConfig, setInvoiceConfig] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [tab, setTab] = useState("tiles");

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    axios
      .get(`${backendUrl}/api/shipping/config`)
      .then((res) => {
        if (res.data?.success) setShippingOn(Boolean(res.data.enabled));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "invoices" || !moduleFeatures.invoicing) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${backendUrl}/api/invoice/config`, { headers: adminHeaders(token) })
      .then((res) => {
        if (res.data.success) setInvoiceConfig(res.data.config);
      })
      .catch(() => toast.error("Could not load invoice settings"));
  }, [tab, moduleFeatures.invoicing]);

  const saveInvoiceConfig = async () => {
    if (!invoiceConfig) return;
    setInvoiceSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${backendUrl}/api/invoice/config`,
        { invoiceConfig },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success("Invoice settings saved");
        setInvoiceConfig(res.data.config);
      } else toast.error(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setInvoiceSaving(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/product/list`, {
        headers: adminHeaders(),
      });
      if (res.data.success) setProducts(res.data.products || []);
    } catch {
      /* ignore */
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/settings`);
      if (res.data.success && res.data.settings) {
        const s = res.data.settings;
        setModuleFeatures(s.features || {});
        const tiles =
          s.categoryTiles?.length > 0
            ? s.categoryTiles.map((tile, i) => ({
                ...tile,
                image:
                  tile.image ||
                  defaultSettings.categoryTiles[i]?.image ||
                  brand.media?.placeholder ||
                  "",
              }))
            : defaultSettings.categoryTiles;

        setSettings((prev) => ({
          ...prev,
          ...s,
          homeConfig: {
            ...prev.homeConfig,
            ...(s.homeConfig || {}),
            featuredProductIds: s.homeConfig?.featuredProductIds || [],
          },
          categoryTiles: tiles,
          promoStrip: { ...prev.promoStrip, ...(s.promoStrip || {}) },
          aboutConfig: { ...prev.aboutConfig, ...(s.aboutConfig || {}) },
          partialPayment: {
            ...prev.partialPayment,
            ...(s.partialPayment || {}),
          },
          policies: Object.fromEntries(
            POLICY_KEYS.map(({ key }) => {
              const p = s.policies?.[key] || {};
              return [
                key,
                {
                  ...p,
                  bodyText: Array.isArray(p.body) ? p.body.join("\n\n") : "",
                },
              ];
            })
          ),
          partialPaymentConfig: s.partialPaymentConfig || null,
        }));
      }
    } catch {
      toast.error("Failed to fetch settings");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name.startsWith("homeConfig.")) {
      const key = name.split(".")[1];
      setSettings((prev) => ({
        ...prev,
        homeConfig: { ...prev.homeConfig, [key]: val },
      }));
    } else if (name.startsWith("promoStrip.")) {
      const key = name.split(".")[1];
      setSettings((prev) => ({
        ...prev,
        promoStrip: { ...prev.promoStrip, [key]: val },
      }));
    } else if (name.startsWith("aboutConfig.")) {
      const key = name.split(".")[1];
      setSettings((prev) => ({
        ...prev,
        aboutConfig: { ...prev.aboutConfig, [key]: val },
      }));
    } else if (name.startsWith("partialPayment.")) {
      const key = name.split(".")[1];
      setSettings((prev) => ({
        ...prev,
        partialPayment: { ...prev.partialPayment, [key]: val },
      }));
    } else if (name.startsWith("policies.")) {
      const [, slug, field] = name.split(".");
      setSettings((prev) => ({
        ...prev,
        policies: {
          ...prev.policies,
          [slug]: {
            ...(prev.policies?.[slug] || {}),
            [field]: val,
          },
        },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: val }));
    }
  };

  const toggleFeaturedId = (id) => {
    setSettings((prev) => {
      const ids = prev.homeConfig.featuredProductIds || [];
      const next = ids.includes(id)
        ? ids.filter((x) => x !== id)
        : [...ids, id];
      return {
        ...prev,
        homeConfig: { ...prev.homeConfig, featuredProductIds: next },
      };
    });
  };

  const addTile = () => {
    setSettings((prev) => ({
      ...prev,
      categoryTiles: [
        ...(prev.categoryTiles || []),
        {
          label: "New tile",
          link: "/shop",
          image: brand.media?.placeholder || "",
          order: prev.categoryTiles?.length || 0,
        },
      ],
    }));
  };

  const applyBrandDefaults = () => {
    setSettings((prev) => ({
      ...prev,
      categoryTiles: defaultSettings.categoryTiles,
      promoStrip: defaultSettings.promoStrip,
    }));
    toast.info(`Promo strip and category tiles reset to ${brand.name} — click Save`);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...settings,
        policies: Object.fromEntries(
          POLICY_KEYS.map(({ key }) => {
            const p = settings.policies?.[key] || {};
            const bodyText = typeof p.bodyText === "string" ? p.bodyText : (p.body || []).join("\n\n");
            return [
              key,
              {
                title: p.title || "",
                body: bodyText
                  .split(/\n\s*\n/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            ];
          })
        ),
      };
      delete payload.partialPaymentConfig;

      const res = await axios.post(`${backendUrl}/api/settings`, payload, {
        headers: adminHeaders(),
      });
      if (res.data.success) {
        toast.success("Settings updated successfully");
        if (res.data.settings?.policies) {
          setSettings((prev) => ({ ...prev, policies: res.data.settings.policies }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <PageHeader
        title="Site settings"
        subtitle="Commerce, homepage blocks, and the four shop-by-category cards."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tz-pink disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
              tab === t.id ? "bg-tz-navy text-white" : "bg-white border border-tz-pink-soft text-tz-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">What is actually live</p>
        <p>Courier partner: {shippingOn ? "on" : "off"} (SHIPPING_ENABLED in backend .env).</p>
        <p>
          Partial / Razorpay checkout is gated by env even if the toggles look on. Click Save after changing tiles or the promo bar.
        </p>
      </div>

      <div className="bg-white border border-tz-pink-soft rounded-2xl p-4">
        <p className="text-sm font-semibold text-tz-navy mb-3">Enabled modules (backend .env)</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "whatsapp", label: "WhatsApp Lite", env: "FEATURE_WHATSAPP" },
            { key: "recommendations", label: "Recommendations", env: "FEATURE_RECOMMENDATIONS" },
            { key: "coupons", label: "Coupons", env: "FEATURE_COUPONS" },
            { key: "reviews", label: "Reviews", env: "FEATURE_REVIEWS" },
            { key: "wishlist", label: "Wishlist", env: "FEATURE_WISHLIST" },
            { key: "instagram", label: "Instagram", env: "FEATURE_INSTAGRAM" },
            { key: "catalogVariants", label: "Catalog variants", env: "FEATURE_CATALOG_VARIANTS" },
            { key: "multiCurrency", label: "Multi-currency", env: "FEATURE_MULTI_CURRENCY" },
            { key: "shipping", label: "Shipping partner", env: "SHIPPING_ENABLED" },
            { key: "razorpay", label: "Razorpay", env: "RAZORPAY_KEY_ID" },
            { key: "partialPayment", label: "Partial payment", env: "PARTIAL_PAYMENT_ENABLED" },
            { key: "partnerOrders", label: "Partner / B2B orders", env: "FEATURE_PARTNER_ORDERS" },
            { key: "invoicing", label: "Invoicing", env: "FEATURE_INVOICING" },
            { key: "analyticsPro", label: "Analytics Pro", env: "FEATURE_ANALYTICS_PRO" },
          ].map(({ key, label, env }) => (
            <span
              key={key}
              title={env}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                moduleFeatures[key]
                  ? "bg-[#89c9b8]/25 text-[#2f6f62]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}: {moduleFeatures[key] ? "ON" : "OFF"}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          WhatsApp admin compose, order quick-actions, and storefront contact links only appear when WhatsApp Lite is ON.
          Redeploy backend after changing .env flags.
        </p>
      </div>

      {tab === "commerce" && (
        <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-6">
          <h3 className="text-lg font-display font-semibold text-tz-navy">Commerce</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery fee (Rs)</label>
              <input type="number" name="deliveryFee" value={settings.deliveryFee} onChange={handleChange} className="w-full border p-2.5 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free shipping from (Rs)</label>
              <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} className="w-full border p-2.5 rounded-xl" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="codEnabled" checked={settings.codEnabled} onChange={handleChange} className="w-5 h-5 rounded" />
            <span className="text-sm font-medium">Enable cash on delivery</span>
          </label>

          <div className="border-t pt-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h4 className="font-semibold text-tz-navy">Partial payment (advance)</h4>
                <p className="text-xs text-gray-500 mt-1">Collect a % via Razorpay; rest on delivery.</p>
              </div>
              {settings.partialPaymentConfig?.envEnabled ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#89c9b8]/25 text-[#2f6f62]">Env: ON</span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Env: OFF</span>
              )}
            </div>
            {!settings.partialPaymentConfig?.envEnabled && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                Master switch is off in backend/.env. Set PARTIAL_PAYMENT_ENABLED=true and restart the API.
              </p>
            )}
            <label className="flex items-center gap-3">
              <input type="checkbox" name="partialPayment.active" checked={settings.partialPayment?.active !== false} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-5 h-5 rounded" />
              <span className="text-sm font-medium">Active in storefront (when env is on)</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance percent (%)</label>
              <input type="number" name="partialPayment.percent" min={settings.partialPaymentConfig?.minPercent || 10} max={settings.partialPaymentConfig?.maxPercent || 50} value={settings.partialPayment?.percent ?? 20} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-full border p-2.5 rounded-xl disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Checkout label</label>
              <input type="text" name="partialPayment.label" value={settings.partialPayment?.label || ""} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-full border p-2.5 rounded-xl disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy notice</label>
              <textarea name="partialPayment.policyNotice" rows={3} value={settings.partialPayment?.policyNotice || ""} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-full border p-2.5 rounded-xl text-sm disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum advance (Rs)</label>
              <input type="number" name="partialPayment.minAdvanceAmount" min={0} value={settings.partialPayment?.minAdvanceAmount ?? 50} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-full border p-2.5 rounded-xl disabled:bg-gray-50" />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="partialPayment.replaceCod" checked={settings.partialPayment?.replaceCod !== false} onChange={handleChange} disabled={!settings.partialPaymentConfig?.envEnabled} className="w-5 h-5 rounded" />
              <span className="text-sm font-medium">Replace classic COD with partial (recommended)</span>
            </label>
          </div>
        </div>
      )}

      {tab === "homepage" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-5">
            <h3 className="text-lg font-display font-semibold text-tz-navy">Homepage sections</h3>
            {[
              ["showHero", "Hero banners"],
              ["showCategories", "Category tiles"],
              ["showNewArrivals", "Featured / new"],
              ["showBestSellers", "Best sellers"],
              ["showInstagram", "Instagram"],
              ["showReviews", "Reviews"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm font-medium">{label}</span>
                <input type="checkbox" name={`homeConfig.${key}`} checked={settings.homeConfig?.[key] !== false} onChange={handleChange} className="w-5 h-5 rounded" />
              </label>
            ))}
            <input type="text" name="homeConfig.newArrivalsTitle" value={settings.homeConfig.newArrivalsTitle || ""} onChange={handleChange} placeholder="Featured section title" className="w-full border p-2.5 text-sm rounded-xl" />
            <input type="text" name="homeConfig.bestSellersTitle" value={settings.homeConfig.bestSellersTitle || ""} onChange={handleChange} placeholder="Bestsellers title" className="w-full border p-2.5 text-sm rounded-xl" />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-4">
            <h3 className="text-lg font-display font-semibold text-tz-navy">About page</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero video / image URL</label>
            <input type="text" name="aboutConfig.heroVideo" value={settings.aboutConfig?.heroVideo || ""} onChange={handleChange} placeholder="Leave empty for the default brand video" className="w-full border p-2.5 rounded-xl text-sm" />
          </div>
        </div>
      )}

      {tab === "tiles" && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-tz-pink-soft space-y-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h3 className="text-lg font-display font-semibold text-tz-navy">Category tiles</h3>
              <p className="text-sm text-tz-navy/50 mt-0.5">Shown on the homepage when Category tiles is on.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={applyBrandDefaults} className="text-sm border border-tz-pink-soft px-3 py-1.5 rounded-xl font-semibold">
                Restore defaults
              </button>
              <button type="button" onClick={addTile} className="text-sm bg-tz-navy text-white px-3 py-1.5 rounded-xl font-semibold">
                Add tile
              </button>
            </div>
          </div>
          <CategoryTilesEditor
            tiles={settings.categoryTiles || []}
            products={products}
            onChange={(categoryTiles) => setSettings((prev) => ({ ...prev, categoryTiles }))}
          />
        </div>
      )}

      {tab === "featured" && (
        <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-4">
          <h3 className="text-lg font-display font-semibold text-tz-navy">Featured products</h3>
          <p className="text-sm text-gray-500">Tick products for the featured row. If none are ticked, newest products are shown.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {products.map((p) => {
              const checked = (settings.homeConfig.featuredProductIds || []).includes(p._id);
              return (
                <label key={p._id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${checked ? "border-tz-pink bg-tz-pink-soft" : "border-gray-100"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleFeaturedId(p._id)} />
                  {p.image?.[0] ? <img src={p.image[0]} alt="" className="w-8 h-8 rounded object-cover" /> : null}
                  <span className="text-sm truncate">{p.name}</span>
                </label>
              );
            })}
            {products.length === 0 && <p className="text-sm text-gray-400">No products yet.</p>}
          </div>
        </div>
      )}

      {tab === "promo" && (
        <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-4">
          <h3 className="text-lg font-display font-semibold text-tz-navy">Announcement bar</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="promoStrip.isActive" checked={settings.promoStrip?.isActive} onChange={handleChange} className="w-5 h-5 rounded" />
            <span className="text-sm font-medium">Show at the top of the shop</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-tz-navy">Message</label>
              <input type="text" name="promoStrip.message" value={settings.promoStrip?.message || ""} onChange={handleChange} disabled={!settings.promoStrip?.isActive} className="mt-1 w-full border p-2.5 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-tz-navy">Link</label>
              <input type="text" name="promoStrip.link" value={settings.promoStrip?.link || ""} onChange={handleChange} disabled={!settings.promoStrip?.isActive} placeholder="/shop" className="mt-1 w-full border p-2.5 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {tab === "policies" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
            Edit footer pages (Shipping, Returns, Privacy, Terms). Changes appear on the storefront after Save — no deploy needed.
          </div>
          {POLICY_KEYS.map(({ key, label, preview }) => {
            const p = settings.policies?.[key] || {};
            return (
              <div key={key} className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-display font-semibold text-tz-navy">{label}</h3>
                  <a
                    href={`${(brand.contact?.websiteUrl || "").replace(/\/$/, "")}${preview}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold underline text-tz-navy"
                  >
                    Preview on shop ↗
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page title</label>
                  <input
                    type="text"
                    name={`policies.${key}.title`}
                    value={p.title || ""}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <p className="text-xs text-gray-500 mb-1">One paragraph per block — separate paragraphs with a blank line.</p>
                  <textarea
                    name={`policies.${key}.bodyText`}
                    rows={6}
                    value={p.bodyText ?? (Array.isArray(p.body) ? p.body.join("\n\n") : "")}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "invoices" && (
        <div className="bg-white p-6 rounded-2xl border border-tz-pink-soft space-y-5">
          {!moduleFeatures.invoicing ? (
            <p className="text-sm text-gray-500">
              Invoicing module is off. Set <code className="text-xs bg-gray-100 px-1 rounded">FEATURE_INVOICING=true</code> in backend .env and restart.
            </p>
          ) : !invoiceConfig ? (
            <p className="text-sm text-gray-500">Loading invoice settings…</p>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-display font-semibold text-tz-navy">Invoices & tax</h3>
                <p className="text-xs text-gray-500 mt-1">
                  GSTIN is optional. Without it, customers receive a standard bill with your registered brand details.
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoiceConfig.enabled !== false}
                  onChange={(e) => setInvoiceConfig({ ...invoiceConfig, enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium">Allow invoice generation</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Legal name</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.legalName || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, legalName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Trade / display name</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.tradeName || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, tradeName: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Registered address</label>
                  <textarea className="mt-1 w-full border p-2.5 rounded-xl text-sm" rows={2} value={invoiceConfig.address || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">City</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.city || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">State</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.state || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, state: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Pincode</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.pincode || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, pincode: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.phone || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.email || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">GSTIN (optional)</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm uppercase" placeholder="Leave empty for non-GST bills" value={invoiceConfig.gstin || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, gstin: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="text-xs font-medium">PAN (optional)</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm uppercase" value={invoiceConfig.pan || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, pan: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Default HSN</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.defaultHsn || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, defaultHsn: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Default GST %</label>
                  <input type="number" className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.defaultGstRate ?? 12} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, defaultGstRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Invoice prefix</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.invoicePrefix || "INV"} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, invoicePrefix: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Credit note prefix</label>
                  <input className="mt-1 w-full border p-2.5 rounded-xl text-sm" value={invoiceConfig.creditNotePrefix || "CN"} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, creditNotePrefix: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={invoiceConfig.pricesIncludeGst !== false} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, pricesIncludeGst: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm">Catalog prices include GST</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={invoiceConfig.showPaymentIds !== false} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, showPaymentIds: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm">Show Razorpay payment IDs on PDF</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={Boolean(invoiceConfig.allowCustomerDownloadBeforeDelivered)} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, allowCustomerDownloadBeforeDelivered: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm">Let customers download before delivery (when invoice exists)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={invoiceConfig.autoGenerateOnDelivered !== false} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, autoGenerateOnDelivered: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm">Auto-generate invoice when all items are delivered</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={invoiceConfig.emailCustomerOnInvoice !== false} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, emailCustomerOnInvoice: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm">Email customers when an invoice is generated</span>
              </label>
              <div>
                <label className="text-xs font-medium">Footer notes on PDF</label>
                <textarea className="mt-1 w-full border p-2.5 rounded-xl text-sm" rows={2} value={invoiceConfig.footerNotes || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, footerNotes: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Bank details (optional)</label>
                <textarea className="mt-1 w-full border p-2.5 rounded-xl text-sm" rows={3} value={invoiceConfig.bankDetails || ""} onChange={(e) => setInvoiceConfig({ ...invoiceConfig, bankDetails: e.target.value })} />
              </div>
              <button type="button" disabled={invoiceSaving} onClick={saveInvoiceConfig} className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {invoiceSaving ? "Saving…" : "Save invoice settings"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;


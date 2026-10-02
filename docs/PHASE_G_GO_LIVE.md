# Phase G — WooCommerce / Hostinger go-live

**Status:** Code ready for live connection. Smoke test blocked until Hostinger WP + Woo + keys are available.

Companion docs: `FRONTEND_ONLY_HOSTINGER_PLAN.md`, `UI_UX_ENHANCEMENT_PLAN.md`.

---

## 1. What engineering finished (no live WC required)

| Area | Change |
|------|--------|
| Product mapping | `categorySlug` / `categorySlugs`, department from top-level cats, `bestseller` (featured + tag), `newArrival` (tag) |
| Slug aliases | `frontend/src/utils/categoryMap.js` + `brand.catalog.slugAliases` |
| Shop / carousels | Filters use alias-aware department/category match |
| Home rails | Bestsellers = featured/tag/IDs; New Arrivals = tag/IDs/date (not featured) |
| Settings | `homeConfig`, promo JSON decode, free-ship default **2999** |
| WP plugin | Promo + home IDs + CORS (Vercel + extra origins) + go-live notes in admin |
| Brand assets | Heroes point at existing `hero-3.webp` until client files arrive |
| Contact | `websiteUrl` → `https://zaynleather.com` |

---

## 2. Client / Hostinger checklist

Copy into a ticket and tick off:

### WordPress / Woo

- [ ] WP + WooCommerce on Hostinger (HTTPS)
- [ ] Currency INR; shipping zones / flat rate + COD
- [ ] REST API keys (Read/Write) — store in Vercel env only
- [ ] JWT Authentication for WP-REST API installed + `JWT_AUTH_SECRET_KEY` in `wp-config.php`
- [ ] Upload/activate `wordpress/zayn-custom-api/`
- [ ] Settings → Zayn Leathers: frontend URL, free shipping ₹2999, promo message, Razorpay keys

### Catalogue taxonomy (critical)

Create **top-level** categories (slugs):

| Slug | Role |
|------|------|
| `men` | Department |
| `women` | Department |
| `kids` | Department (optional) |
| `bags` | Department |
| `accessories` | Department |

Child categories can use any slug (e.g. `leather-jackets`, `biker-jackets`). Assign products to **parent + child**.

If client uses different slugs (`mens`, `womens`), add them under `catalog.slugAliases` in `shared/brands/zayn-leathers.js`.

### Product flags

| Home section | How to mark in Woo |
|--------------|--------------------|
| Best sellers | Product → **Featured**, or tag `bestseller`, or IDs in Zayn settings |
| New arrivals | Tag `new-arrival`, or IDs in Zayn settings, else newest by date |

### Frontend env (Vercel / `.env.production`)

```env
VITE_BACKEND_MODE=woocommerce
VITE_WC_URL=https://YOUR-WP-HOST
VITE_WC_CONSUMER_KEY=ck_...
VITE_WC_CONSUMER_SECRET=cs_...
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

### Assets (optional but recommended)

- [ ] Replace `/brand/heroes/hero-3.webp` with real hero/popup images
- [ ] Update `brand.popup.image` and `brand.media.heroes[]`
- [ ] Confirm contact email / WhatsApp

---

## 3. Smoke test script (run after env is live)

1. Home loads heroes + Best Seller + New Arrivals (not empty / not identical by accident)
2. Nav Men / Women mega → Shop filters correct products
3. Search → results
4. PDP → size → Add to cart → header total updates
5. Cart → Items total matches header → Checkout
6. COD order succeeds; appears under Account → Orders
7. Razorpay path creates order when key set
8. Welcome popup subscribe → WP admin email / newsletter CPT
9. Custom Jackets form submit → admin notification
10. Mobile: drawer accordion, full-width search, sticky ATC / checkout

---

## 4. Blocked on client

Live smoke test (G6) cannot complete until Hostinger invite includes working Woo, JWT, plugin, and REST keys.

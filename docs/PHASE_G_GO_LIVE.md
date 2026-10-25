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

Storefront SSOT: `shared/brands/zayn-leathers.js` → `catalog.taxonomy` + `catalog.megaMenu` + `catalog.slugAliases`.

#### Top-level departments (Woo parent categories)

| Slug | Role | Storefront |
|------|------|------------|
| `men` | Department | `/shop?department=men` |
| `women` | Department | `/shop?department=women` |
| `accessories` | Department (bags live here) | `/shop?department=accessories` |
| `kids` | Department | `/shop?department=kids` |

Do **not** create a top-level `bags` department for new catalogue work. If an old `bags` category exists, keep the slug and rely on `slugAliases` (`bags` → `accessories`) so `/shop?department=bags` still finds products.

#### Leaf categories (children under the matching department)

Assign each product to **parent department + leaf**. Slug rule: lowercase, spaces → `-`.

**Men (examples):** `leather-jackets`, `bomber-jackets`, `biker-jackets`, `suede-jackets`, `shearling-jackets`, `sheepskin-jackets`, `aviator-jackets`, `hooded-jackets`, `blouson-jackets`, `distressed-jackets`, `faux-leather-jackets`, `perforated-jackets`, `slim-fit-jackets`, `vintage-jackets`, `varsity-jackets`, `puffer-jackets`, `leather-blazers`, `leather-coats`, `sheepskin-coats`, `shearling-coats`, `trench-coats`, `double-breasted-coats`, `leather-gilets`, `leather-waistcoats`, `leather-shirt-jackets`

**Women (examples):** `leather-jackets`, `biker-jackets`, `bomber-jackets`, `suede-jackets`, `shearling-jackets`, `sheepskin-jackets`, `aviator-jackets`, `hooded-jackets`, `distressed-jackets`, `faux-leather-jackets`, `slim-fit-jackets`, `oversized-jackets`, `vintage-jackets`, `leather-blazers`, `leather-coats`, `shearling-coats`, `sheepskin-coats`, `trench-coats`, `double-breasted-coats`, `leather-waistcoats`

**Accessories:** `leather-bags`, `leather-belts`, `leather-caps`, `leather-gloves`, `leather-shoes`, `leather-wallets`, `leather-leggings`

**Other / themed (category filter, optional kids parent):** `kids-leather-jackets`, `movie-jackets`, `superhero-jackets`, `video-game-jackets`

#### Colour = product attribute (not Woo categories)

Do **not** create categories like “Black Leather Jackets”. Set a global product attribute (e.g. `pa_color` / Colour) with terms:

`black`, `brown`, `blue`, `green`, `white`, `red`

Storefront filters via `/shop?color=black` (optionally with `department=men|women`). Mega “Shop by colour” links use the same query.

If client uses different slugs (`mens`, `womens`, `handbags`), add them under `catalog.slugAliases` in `shared/brands/zayn-leathers.js`.

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
2. Nav Men / Women / Accessories mega → Shop filters; colour links (`?color=`) filter products
3. Legacy `/shop?department=bags` still resolves via accessories alias
4. Search → results
5. PDP → size → Add to cart → header total updates
6. Cart → Items total matches header → Checkout
7. COD order succeeds; appears under Account → Orders
8. Razorpay path creates order when key set
9. Welcome popup subscribe → WP admin email / newsletter CPT
10. Custom Jackets form submit → admin notification
11. Mobile: drawer accordion, full-width search, sticky ATC / checkout

---

## 4. Blocked on client

Live smoke test (G6) cannot complete until Hostinger invite includes working Woo, JWT, plugin, and REST keys.

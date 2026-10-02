# Zayn Leathers — Frontend-Only + Hostinger (WordPress / WooCommerce)

**Decision:** Client does **not** want a custom Node/Mongo backend from our side.  
**Delivery:** React storefront only. Backend = client's **Hostinger** WordPress + WooCommerce (+ plugins).  
**Admin:** Client manages products, orders, coupons in **WordPress / WooCommerce admin** — our React `admin/` app is **out of scope** for this client.

---

## 1. Goal

| Deliver | Do not deliver |
|---------|----------------|
| React storefront (catalog, cart, checkout, account, wishlist) | Express / Mongo / Render API |
| Connect to Hostinger WP + Woo via REST / Store API | Custom React admin panel |
| Razorpay + COD via Woo / custom WP plugin | Hosting the backend ourselves |
| Domain `zaynleather.com` on Hostinger | Feature parity with every white-label add-on |

---

## 2. Architecture (target)

```
┌─────────────────────────┐         ┌──────────────────────────────────┐
│  React storefront       │  HTTPS  │  Hostinger                       │
│  (Vercel / static host) │ ──────► │  WordPress + WooCommerce         │
│  frontend/              │         │  - Products, orders, customers   │
│                         │         │  - JWT Auth plugin               │
│  VITE_BACKEND_MODE=     │         │  - Zayn Custom API plugin        │
│    woocommerce          │         │  - Razorpay (plugin or custom)   │
└─────────────────────────┘         │  - Shipping partner (client API) │
                                    └──────────────────────────────────┘
```

- **Frontend host:** Vercel (or similar). Point `zaynleather.com` DNS A/CNAME to frontend host **or** serve WP on subdomain/API-only and frontend on apex — confirm with client.
- **Recommended DNS split:** `zaynleather.com` → React; `api.zaynleather.com` or keep WP on same domain with `/wp-json/*` (common headless pattern: WP at root, React elsewhere — **must agree CORS origins**).

---

## 3. What stays / what drops

### Keep (storefront)

- Home, Shop, PDP, Cart, Checkout, Orders, Wishlist, Login/Register, Account, Contact, About, Policies  
- Brand config (`shared/brands/zayn-leathers.js`)  
- Razorpay UI + COD  
- Coupons (via Woo Store API)  
- Basic reviews (Woo product reviews)

### Drop or defer (no Node backend)

| Feature | Action |
|---------|--------|
| React Admin (`admin/`) | **Out of scope** — use WP/Woo admin |
| OTP registration | **Simplify** → Woo customer register + email verify (or plain register) |
| Custom recommendations engine | Defer / related products via Woo |
| GST PDF invoices / credit notes | Defer — Woo invoice plugins later |
| Shiprocket deep ops (labels, returns admin) | Client shipping plugin / Shiprocket Woo plugin |
| Analytics Pro digests | Defer |
| Instagram / Hero CMS via Node | WP plugin options or static brand media |
| Partial payments | Defer unless plugin supports |

---

## 4. Hostinger / client checklist

Accept Hostinger invite → confirm:

1. [ ] WordPress installed on `zaynleather.com` (or staging URL)
2. [ ] WooCommerce installed + currency INR
3. [ ] Products exist (or plan to import from current catalogue)
4. [ ] SSL active (HTTPS required for JWT + Razorpay)
5. [ ] WooCommerce → Settings → Advanced → REST API → create **Read/Write** keys for headless (prefer Store API for cart; keep CK/CS server-side where possible)
6. [ ] Install **JWT Authentication for WP-REST API**
7. [ ] Install plugin folder `wordpress/zayn-custom-api/` (settings, wishlist fallback, Razorpay, password reset)
8. [ ] CORS: allow frontend origin (localhost + production) in plugin
9. [ ] Razorpay keys from client
10. [ ] Shipping partner API / Woo shipping method from client
11. [ ] Confirm where React is hosted (Vercel recommended)

**Admin access alone is not enough** — WP + Woo + plugins must be live.

---

## 5. Implementation phases

### Phase 0 — Plan & mode switch (this doc + code start)

- [x] Write this plan
- [x] `VITE_BACKEND_MODE=woocommerce` actually switches the storefront
- [x] Unified `shopApi` facade used by `ShopContext`

### Phase 1 — Core catalogue & session (implement now)

- [x] Products list / single product via Woo adapters
- [x] Categories tree via Woo
- [x] Site settings + exchange rates via `zayn/v1` (with fallbacks)
- [x] Login / register / profile via JWT + WC customers
- [x] Cart: guest localStorage + Store API when logged in (or Store API Cart-Token for guests)

### Phase 2 — Checkout & orders

- [x] COD place order via Woo orders API / Store checkout
- [x] Razorpay create + verify via `zayn/v1/razorpay/*`
- [x] Orders list + order detail for customer
- [x] Coupons via Store API

### Phase 3 — Account extras

- [x] Wishlist via `zayn/v1/wishlist` (or YITH)
- [x] Password forgot/reset via plugin
- [x] Contact form → WP or email plugin
- [x] Soft-disable Node-only UI (recommendations, invoice PDFs, OTP screens)

### Phase 4 — Go-live

- [x] Catalogue mapping hardened (slugs, tags, home rails) — see `docs/PHASE_G_GO_LIVE.md`
- [x] Plugin: promo strip, home IDs, CORS for Vercel
- [ ] Production env on Vercel (needs client WC URL + keys)
- [ ] Install/activate plugins on Hostinger
- [ ] CORS + JWT secret in `wp-config.php`
- [ ] Smoke test: browse → cart → COD → Razorpay → account
- [ ] Hand over WP admin to client; archive our `backend/` as unused for this deal

---

## 6. Env (frontend)

```env
VITE_BACKEND_MODE=woocommerce
VITE_WC_URL=https://zaynleather.com
VITE_WC_CONSUMER_KEY=ck_xxxxxxxx
VITE_WC_CONSUMER_SECRET=cs_xxxxxxxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
```

Do **not** set `VITE_BACKEND_URL` in production for this client.

Local Node mode (dev only / other clients):

```env
# VITE_BACKEND_MODE=node   (default if unset)
VITE_BACKEND_URL=http://localhost:5000
```

---

## 7. Repo map

| Path | Role after conversion |
|------|------------------------|
| `frontend/` | **Primary deliverable** |
| `frontend/src/api/` | Woo client + adapters + `shopApi` switch |
| `wordpress/zayn-custom-api/` | Install on Hostinger |
| `shared/` | Brand SSOT — keep |
| `backend/` | Not deployed for this client |
| `admin/` | Not deployed for this client |

---

## 8. Effort & risk

| Area | Risk | Mitigation |
|------|------|------------|
| Size / variant matrix | High | Map Woo attributes + meta `_size_prices`; simplify PDP if needed |
| Consumer keys in Vite | Medium | Prefer read-only CK for browse; mutations via JWT + Store API |
| OTP vs simple register | Low | Drop OTP in Woo mode |
| Shipping | Medium | Wait for client Shiprocket/Woo plugin |
| Incomplete WP plugin | Medium | Finish Razorpay + wishlist before go-live |

**Estimate:** Phase 1–2 ~1–2 weeks focused work after WP is ready on Hostinger. Blocked until Hostinger has Woo + SSL.

---

## 9. Success criteria

1. Storefront runs with **no** Render/Node API  
2. Products and categories load from Hostinger Woo  
3. Customer can register, login, add to cart, place COD order  
4. Razorpay works when keys + plugin configured  
5. Client manages catalogue in WP admin only  

---

## 10. Immediate next actions (engineering)

1. ~~Land mode switch + `shopApi` + rewire `ShopContext`~~ ✅
2. ~~Rewire Login / Register (no OTP in Woo mode)~~ ✅
3. ~~Rewire PlaceOrder COD/Razorpay + Orders + Product fetch~~ ✅
4. ~~Soft-hide Node-only UI~~ ✅ (recommendations, video reviews, color variants, Shiprocket pin, partial pay, invoices/returns)
5. ~~Contact / Instagram / Banner / Coupons / Reviews / Account / Forgot-Reset~~ ✅
6. Client: accept Hostinger invite, install Woo + JWT + Zayn plugin
7. Smoke test against live `VITE_WC_URL`

### Frontend completeness (Woo mode)

| Area | Status |
|------|--------|
| Products / categories / settings / rates | ✅ via `shopApi` |
| Auth login / register (no OTP) | ✅ |
| Forgot / reset password | ✅ (+ WP plugin email link) |
| Cart / wishlist | ✅ |
| Checkout COD + Razorpay | ✅ |
| Orders list + detail | ✅ (cancel/return/invoice deferred) |
| Coupons | ✅ |
| Product reviews | ✅ |
| Contact form | ✅ (+ WP plugin) |
| Hero banners | ✅ (WP option or brand fallback) |
| Instagram | ✅ (WP option or brand fallback) |
| Account profile / password / addresses | ✅ (billing+shipping slots in Woo) |
| Recommendations / video reviews / color variants | Soft-disabled in Woo |
| Custom admin / Node API | Not used for this client |

### Still blocked on client Hostinger

- WordPress + WooCommerce installed with products
- JWT Auth plugin
- Upload/activate `wordpress/zayn-custom-api/`
- Woo REST keys + Razorpay keys in env
- Live smoke test

### Code landed

| File | Change |
|------|--------|
| `docs/FRONTEND_ONLY_HOSTINGER_PLAN.md` | This plan |
| `frontend/src/api/mode.js` | Mode detection |
| `frontend/src/api/shopApi.js` | Full Node ↔ Woo facade |
| `frontend/src/context/ShopContext.jsx` | Uses `shopApi` |
| Pages: Login, Register, PlaceOrder, Orders, OrderDetail, Products, Contact, Account, Forgot/Reset | Wired |
| Components: Coupon, Reviews, Banner, Instagram, SimilarColor, VideoReviews, RecommendationRail | Wired / soft-disabled |
| `wordpress/zayn-custom-api/` | Contact, Instagram, addresses, change-password, frontend URL |
| `frontend/.env.example` | Woo mode default |

Set locally:

```env
VITE_BACKEND_MODE=woocommerce
VITE_WC_URL=https://YOUR-HOSTINGER-WP-URL
VITE_WC_CONSUMER_KEY=...
VITE_WC_CONSUMER_SECRET=...
VITE_RAZORPAY_KEY_ID=...
```


# Zayn Leathers — Admin & platform audit (fixes & improvements)

**Purpose:** Honest status check after Phases A–E and WhatsApp / UI polish. Lists what is complete, what is broken, what is missing vs `docs/ADMIN_ENHANCEMENT_PLAN.md`, and cross-cutting storefront gaps from `docs/UX_ENHANCEMENT_PLAN.md`.

**Audit date:** 20 August 2026  
**Scope:** `admin/`, admin-facing `backend/` routes, `shared/brands/`, storefront touchpoints (reviews, SEO, category tiles, contact).

---

## Executive summary

| Area | Verdict |
|------|---------|
| **Phases A–E (admin plan)** | **Mostly shipped** — order detail, session handling, dashboard relabel, catalog search/hide/duplicate, customer 360, CSV/print, mobile nav, WhatsApp compose, contacts/coupons/product-review moderation |
| **Production-ready for daily ops** | **Yes for P0–P1** — audit items through P1 fixed 20 Aug 2026; **P2** (roles, stock-per-size, activity log) remains |
| **P2 (roles, 2FA, stock-per-size, activity log)** | **Not started** — correctly out of scope unless requested |

**P0 + P1 completed 20 Aug 2026.** Next: P2 when requested (roles, stock-per-size, activity log, policy CMS).

---

## Completeness vs `ADMIN_ENHANCEMENT_PLAN.md`

### Shipped and verified in code

| Plan item | Status | Notes |
|-----------|--------|-------|
| P0.1 Order detail, search, copy, confirm status | ✅ | `/orders/:id`, `OrderDetail.jsx`, `ConfirmModal` on list + detail; search includes phone, email, product name (`orderMatchesQuery`) |
| P0.2 Session expiry | ✅ | `App.jsx` axios interceptor + `isAdminAuthFailure`; Login “Remember me” → 7d admin JWT |
| P0.3 Dashboard leather labels | ✅ | UI shows Apparel / Bags / Accessories; internal API still uses `tote*` aliases (harmless) |
| P0.4 Product list search, low stock, hide | ✅ | `List.jsx`: query, `lowStockOnly` (≤5), `/api/product/visibility` |
| P0.5 Product review moderation | ✅ | `ProductReviews.jsx` + `PATCH/DELETE /api/reviews/mod/:id` |
| P0.6 Settings honesty | ✅ | Env-gated partial payment banner in `Settings.jsx` |
| P1.1 Customer 360 | ✅ | `UserDetail.jsx`, `GET /api/user/admin/:id`, user search |
| P1.2 Contacts inbox | ✅ | Read/unread, notes, mailto/tel/WhatsApp, delete |
| P1.3 Coupons | ✅ | Min order, pause, used count, confirm delete |
| P1.4 Returns queue | ✅ | Filters: `Returns`, `RTO`, `CancelledToday`, return reason display |
| P1.5 Catalog quality | ✅ | SKU, seoTitle, imageAlt, 8 images, duplicate, inline stock |
| P1.6 Export & print | ✅ | `downloadOrdersCsv`, packing slip + `@media print` |
| P1.7 Mobile nav & icons | ✅ | Sidebar drawer, Lucide icons, `PageHeader` on most pages |
| P1.8 Auth headers (partial) | ⚠️ | `adminHeaders()` sends both `token` and `Bearer`; backend accepts both via `adminAuth` / `authUser` |
| WhatsApp click-to-chat | ✅ | `whatsapp.js`, `WhatsAppCompose` on Orders, OrderDetail, UserDetail |
| Edit refetch by id | ✅ | `Edit.jsx` loads `GET /api/product/:id` |

### Not shipped / still open from admin plan

| Plan item | Status | Gap |
|-----------|--------|-----|
| P0.1 Server-side order pagination | ✅ | `POST /api/order/list` with filters + pagination |
| P0.5 Require login for PDP reviews | ✅ | Customer JWT required; storefront sign-in gate |
| P1.8 Auth header consistency | ✅ | `adminHeaders()` standardized on remaining admin pages |
| P1.9 Policy CMS | ❌ | Static policy pages; not in admin |
| P2 Staff roles, 2FA, stock-per-size, activity log | ❌ | As documented — out of scope |

---

## P0 — Bugs & broken functionality (fix first)

**Status: fixed 20 Aug 2026**

### P0.1 — Homepage video admin uses wrong API routes ✅

**Fixed in:** `admin/src/pages/Review.jsx` — all calls now use `/api/video-reviews` (list, upload, delete) with error toasts and `PageHeader`.

---

### P0.2 — Dashboard recent orders show wrong totals (+₹41) ✅

**Fixed in:** `admin/src/pages/Dashboard.jsx` — recent orders table uses `order.amount` directly.

---

### P0.3 — Category tile default images are missing from the repo ✅

**Fixed:** Added SVG placeholders under `frontend/public/brand/categories/` and `admin/public/brand/categories/`; aligned `shared/brands/zayn-leathers.js`, `backend/routes/settingsRoutes.js`, and `admin/src/pages/Settings.jsx` defaults to `.svg` paths. Added `product-placeholder.svg`.

**Note:** Existing Mongo settings may still point at old broken `.jpg` paths until admin clicks **Restore defaults** (or re-picks images) and **Save** in Settings → Category tiles.

---

### P0.4 — Brand contact details are empty ✅

**Fixed in:** `shared/brands/zayn-leathers.js` — populated email, phone, WhatsApp, and Mumbai store address (same business entity as prior Afiya rebrand). Update `websiteUrl` when Zayn production domain is live.

---

## P1 — Gaps, incomplete work, and quality issues

**Status: fixed 20 Aug 2026**

| Item | Fix |
|------|-----|
| P1.1 Server-side order pagination | `POST /api/order/list` accepts `page`, `limit`, `status`, `q`, `sortOrder`, `dateFrom`, `dateTo`, `exportAll`; `Orders.jsx` uses server pagination + stats |
| P1.2 PDP SEO | `Products.jsx` renders `<SEO title={seoTitle \|\| name} … />` (Shop already had SEO) |
| P1.3 Review auth | `POST /api/reviews` requires customer JWT + rate limit; `ReviewSection` sign-in gate |
| P1.4 Admin review list protected | `GET /api/reviews/admin` with `adminAuth`; public list route removed |
| P1.5 Category tree admin flag | `?admin=1` returns 403; use `/api/categories/admin` |
| P1.6 Add.jsx eval removed | `sizeFiles` array like Edit |
| P1.7 Add.jsx ₹ labels | Price fields use INR |
| P1.8 Auth headers | `adminHeaders()` on Categories, Hero, Instagram, HeroUploadCard |
| P1.9 Duplicate SKU | Unique suffix on copy SKU; clearer admin toasts |
| P1.10 Console logs | Removed from Add, Orders, ReviewSection |
| P1.11 Admin login rate limit | 10 attempts / 15 min on `POST /api/user/admin` |
| P1.12 UX polish | UserDetail `PageHeader`, Settings ₹ promo, sidebar “Product reviews”, CSV server export, dashboard `apparelData` chart keys |

**Note:** Guest checkout orders still won't appear on Customer 360 until guest checkout exists (by design).

---

## P2 — Enhancements & future work

**Scope update (20 Aug 2026):** See **[`docs/CATALOG_VARIANTS_AND_STOCK_PLAN.md`](CATALOG_VARIANTS_AND_STOCK_PLAN.md)** — **finalised**, ready to implement.

**In scope:** Variant/style linking · **stock + price per size** · **Policy CMS** · **guest checkout**

**Dropped unless asked:** staff roles, 2FA, activity log, low-stock digest, dashboard date-range, bulk CSV, etc.

---

## Cross-cutting — storefront (`UX_ENHANCEMENT_PLAN.md`)

| Item | Status |
|------|--------|
| Guest cart, address book, account | ✅ Shipped |
| Global search, PDP UX, coupons on cart | ✅ Shipped |
| **Zayn contact details** | ✅ Filled in `shared/brands/zayn-leathers.js` (20 Aug 2026) |
| **Guest checkout without login** | ❌ Still open |
| **Google login** | Postponed (per plan) |
| **Sitemap / Search Console** | Not verified in this audit — confirm before launch |
| PDP SEO from admin fields | ✅ `seoTitle` on PDP (P1.2) |
| Review trust | ✅ Login required to post; admin moderation unchanged |

---

## Security & operational risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Wrong video review API (P0.1) | **Resolved** | Fixed 20 Aug 2026 |
| Public `GET /api/reviews` lists hidden reviews | **Resolved** | Admin-only `/api/reviews/admin` |
| Anonymous review POST | **Resolved** | Auth + rate limit |
| Category tree `?admin=1` without auth | **Resolved** | Returns 403 |
| JWT in console | **Resolved** | Removed from audited pages |
| No admin login rate limit | **Resolved** | 10 / 15 min limiter |
| COD-only with partial/Razorpay toggles visible | **Low** | Already documented in Settings UI |
| Mongo / Cloudinary legacy names (`afiyaleathers`, `afiya-leathers`) | **Info** | Intentional per brand config — document for ops |
| Backend restart after route changes | **Ops** | Document in runbook (duplicate 404 reports) |

---

## Recommended fix order

P0 and P1 are complete. When ready, pick from **P2** (roles, stock-per-size, activity log, policy CMS, bulk catalog tools).

---

## Verification checklist (manual QA)

Use after applying fixes:

- [ ] **Admin login** — remember me 7d; session expiry clears token and shows toast
- [ ] **Orders** — search by phone; open detail; copy address; status change requires confirm; WhatsApp opens with template; CSV download; print packing slip
- [ ] **Products** — search, low stock filter, hide/show, inline stock save, **duplicate** (after backend restart), edit reloads by id, 8 images + SKU/SEO/alt save
- [ ] **Homepage videos** — list, upload, delete via `/api/video-reviews`
- [ ] **Product reviews** — post on storefront; hide/delete in admin; hidden not visible on PDP
- [ ] **Customers** — search; open 360; WhatsApp customer template
- [ ] **Contacts** — mark read, note, delete
- [ ] **Coupons** — create with min order, pause, delete with confirm
- [ ] **Settings** — category tiles save with product images; promo bar; partial payment disabled when env off
- [ ] **Dashboard** — recent order amounts match `order.amount`; charts show Apparel/Bags/Accessories
- [ ] **Storefront** — category tiles render; footer phone/email; PDP title uses seoTitle when set

---

## Related docs

- `docs/ADMIN_ENHANCEMENT_PLAN.md` — original scope & phase labels
- `docs/UX_ENHANCEMENT_PLAN.md` — customer-facing remaining work
- `docs/GO_LIVE_DEPLOYMENT.md` — deployment runbook (if present)

---

*Generated from codebase review on 20 Aug 2026. Update this file when fixes land or scope changes.*

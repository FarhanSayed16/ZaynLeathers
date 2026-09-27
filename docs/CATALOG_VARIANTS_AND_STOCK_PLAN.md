# Zayn Leathers — Catalog variants, stock, pricing & go-live plan

**Purpose:** Fix admin/catalog pain (colour variants, style linking, **stock + price per size**), plus **Policy CMS** and **guest checkout** so Zayn can run the shop without deploys for copy changes and without forcing login at checkout.

**Status:** **Finalised — ready to implement** (decisions locked 20 Aug 2026)  
**Related:** `docs/ADMIN_AUDIT_AND_FIXES.md`, `docs/UX_ENHANCEMENT_PLAN.md`, `docs/ADMIN_ENHANCEMENT_PLAN.md`

---

## Decisions locked (Zayn confirmed)

| Topic | Decision |
|-------|----------|
| **In scope** | Variant/style linking · stock per size · **price per size** · Policy CMS · guest checkout |
| **Out of scope** | Staff roles, 2FA, activity log, low-stock digest, dashboard date-range, bulk CSV, invoice PDF |
| **Colour vs price** | **Same price for all colours** of a style — price does **not** change by colour |
| **Size vs price** | **Price can differ by size** (e.g. XL costs more) — set manually in a simple grid |
| **Size vs stock** | **Stock is per size** (and per colour variant doc) |
| **Primary grouping key** | **`parentId`** = Style; storefront + admin both use it |
| **`secondaryName`** | Style display name — auto-synced across colour variants |
| **Shop card if colour hidden** | Show next active colour automatically |
| **Description** | Shared across colours in v1 (no per-colour override yet) |
| **Migration duplicates** | Script picks primary listing; admin confirms in cleanup UI |
| **Bags / one-size items** | Single row: `One Size` with qty + price |
| **SKU** | **One SKU per colour** (e.g. `BJK-BLK-01`); size on order line only |
| **Approach** | Evolve Mongo (one doc per colour variant); no new admin framework |

---

## Executive summary

**Catalog today:** Two manual keys link “same jacket, different colour” (`parentId` vs `secondaryName`). The shop lists every colour separately. One stock number and one price apply to all sizes on a product.

**Catalog target:** One **Style** (`parentId`), multiple **colour variants** (separate docs, same style-level pricing rules), and a **size grid** on each colour: **qty + price (+ optional old price) per size**. Colours share the same size *structure*; admin fills the grid once per colour (prices often identical across colours, copied from style default).

**Go-live extras:** **Policy CMS** in admin (edit shipping/returns/privacy/terms without code deploy). **Guest checkout** (cart already works logged-out; checkout captures address + phone without account, optional post-order account).

---

## Part 1 — Current state (abbreviated)

See prior audit in git history. Headline issues:

| Area | Problem |
|------|---------|
| Variants | `parentId` (Add only) vs `secondaryName` (swatches) — not synced |
| Admin | Three naming fields; flat list; duplicate breaks variant groups |
| Shop | One card per colour variant |
| Stock | Single `availableQuantity` for all sizes |
| Price | Single `price` on doc — **cannot price XL differently** |
| Orders | No colour/SKU snapshot on line items |
| Policies | Hardcoded in `frontend/src/pages/Policy.jsx` — need deploy to edit |
| Checkout | `PlaceOrder.jsx` **requires login**; guest cart exists but cannot complete order |

---

## Part 2 — Target model

### 2.1 Concepts (admin language)

| Admin term | Field | Meaning |
|------------|-------|---------|
| **Style** | `parentId` | One design — shared category, description, size chart, size list |
| **Style name** | `secondaryName` | e.g. “Classic Biker Jacket” — synced on all colours |
| **Colour variant** | product doc + `color` | Black / Brown — own images, SKU, **size grid** |
| **Size row** | `sizeMatrix[]` | Per size: **price**, **oldPrice** (opt), **qty** |
| **Listing** | shop | One card per style on `/shop` |

### 2.2 Pricing rules (locked)

```
Colour A ── same style ── Colour B
     │                        │
     └── each has sizeMatrix ──┘
              S: ₹2,999 × 5
              M: ₹2,999 × 8
              L: ₹3,199 × 3   ← XL/L can cost more
              XL: ₹3,399 × 2
```

- **Not allowed / not needed:** different base price per colour for the same style.
- **Admin UX:** One **Size & pricing** table on Add/Edit:

  | Size | Price (₹) | Old price (₹) | Stock |
  |------|-----------|---------------|-------|
  | S    | 2999      | 3499          | 5     |
  | M    | 2999      | 3499          | 8     |
  | L    | 3199      | —             | 3     |

- **Adding a new colour:** Copy size list + prices from style default (or first sibling); admin only changes images, colour name, SKU, and stock if needed.
- **Shop card price:** Show **“From ₹X”** = minimum price across active sizes on primary colour (or style).
- **PDP:** When customer picks a size, show that size’s price (and update cart line price).

### 2.3 Data shape (recommended)

```js
// On each colour variant document
sizes: ["S", "M", "L", "XL"],           // ordered list of offered sizes
sizeMatrix: [
  { size: "S",  price: 2999, oldPrice: 3499, qty: 5 },
  { size: "M",  price: 2999, oldPrice: 3499, qty: 8 },
  { size: "L",  price: 3199, oldPrice: null,  qty: 3 },
],
// Legacy fields during migration:
price: 2999,              // = min(sizeMatrix.price) or first size
oldPrice: 3499,             // = matching oldPrice if uniform
availableQuantity: 16,     // = sum(sizeMatrix.qty) — computed on save
```

**Validation on save:**

- Every entry in `sizes[]` has a `sizeMatrix` row.
- `qty >= 0`, `price > 0`.
- Unique `(parentId, color)`.
- All siblings share `secondaryName` and `sizes[]` structure (prices may differ per colour only if admin explicitly edits — default is copy from style).

### 2.4 Variant family rules

1. `parentId` — auto-generated on first colour; read-only in UI (advanced override optional).
2. `secondaryName` — enforced identical across siblings on save.
3. `color` — unique per `parentId`; normalized leather colour list.
4. `name` — suggested `{styleName} — {color}`.
5. Duplicate product → **new style** (new `parentId`), not new colour.

**Index:** `{ parentId: 1, color: 1 }` unique.

---

## Part 3 — Storefront behaviour

| Area | Behaviour |
|------|-----------|
| Shop grid | One card per `parentId`; “From ₹X”; primary colour image |
| PDP colours | `GET /api/product/variants/:parentId` (active only); label + current ring |
| PDP sizes | Only sizes with `qty > 0`; show price for selected size |
| Add to cart | `productId + size`; line price = `sizeMatrix[size].price` |
| Checkout | Validates stock for that size; decrements `sizeMatrix[size].qty` |

---

## Part 4 — Admin UX (target)

### Workflow A — New style (first colour)

1. Style name, category, description, size chart images.
2. **Size & pricing table** — add rows (size, price, old price, stock).
3. Colour, gallery images, SKU.
4. System creates `parentId`; shop shows one listing.

### Workflow B — Add colour

1. From grouped List → **Add colour** on a style.
2. Pre-filled: style name, category, description, **same size rows & prices**.
3. Admin sets new colour, images, SKU; adjust stock only if needed.

### Workflow C — Daily ops

1. Grouped list by style → expand → colours × size summary (`M:8 @ ₹2999`).
2. Inline edit stock (and optional price) per size.
3. Low stock if any size `qty ≤ 5`.

---

## Part 5 — Implementation phases (final order)

### Phase V1 — Variant linking foundation

| # | Deliverable |
|---|-------------|
| V1.1 | Auto `parentId`; remove manual field from Add |
| V1.2 | Sync `secondaryName` across siblings on save |
| V1.3 | PDP swatches via `/api/product/variants/:parentId` |
| V1.4 | Unified colour picker + validation |
| V1.5 | Edit: Style ID + sibling colour panel |
| V1.6 | Duplicate → new style |
| V1.7 | Short in-app “Styles & colours” help |

**Exit:** Swatches and linking work; admin no longer types parent id.

---

### Phase S1 — Size matrix (stock + price per size)

| # | Deliverable |
|---|-------------|
| S1.1 | Schema `sizeMatrix` + migration from `price` / `availableQuantity` |
| S1.2 | Add/Edit: size × price × old price × qty grid |
| S1.3 | Backend: save validation; compute legacy `price` + `availableQuantity` |
| S1.4 | `placeOrder` / cancel: price from matrix; decrement/increment `qty` by size |
| S1.5 | PDP: size selector updates price; disable OOS sizes |
| S1.6 | Cart/checkout use per-size price |
| S1.7 | Admin stock API + list summary |

**Exit:** XL can cost more than M; M can be OOS while L is in stock.

---

### Phase V2 — Style-centric admin

| # | Deliverable |
|---|-------------|
| V2.1 | List grouped by style |
| V2.2 | **Add colour** flow (pre-filled grid) |
| V2.3 | Hide style / hide colour actions |
| V2.4 | Optional: variant cleanup page (migration) |

**Exit:** Adding Black when Brown exists takes minutes, not a full duplicate form.

---

### Phase S2 — Shop deduplication

| # | Deliverable |
|---|-------------|
| S2.1 | Storefront product list deduped by `parentId` |
| S2.2 | “From ₹X” on cards |
| S2.3 | Search returns one card per style |

**Exit:** Shop no longer shows duplicate jackets per colour.

---

### Phase O1 — Order snapshots

| # | Deliverable |
|---|-------------|
| O1.1 | Order items: `color`, `sku`, `size`, `price` (already size-specific) |
| O1.2 | Admin order detail + packing slip show colour · size · SKU |

---

### Phase P1 — Policy CMS

**Why include:** Policies are hardcoded in `Policy.jsx`. Zayn needs to edit shipping/returns copy for COD, RTO, and leather returns **without a developer deploy**.

| # | Deliverable |
|---|-------------|
| P1.1 | `SiteSettings.policies` (or dedicated doc): `shipping`, `returns`, `privacy`, `terms` — array of paragraphs or markdown |
| P1.2 | Admin **Settings → Policies** tab: four text areas + preview link |
| P1.3 | Storefront `Policy.jsx` loads from `GET /api/settings` (fallback to current hardcoded text) |
| P1.4 | Seed Zayn-default policy text on first load |

**Exit:** Owner edits return window / COD wording in admin; footer pages update live.

**Effort:** Small–medium (parallel to V2 or after S1).

---

### Phase G1 — Guest checkout

**Why include:** Guest **cart** already works (`localStorage` + merge on login). **Checkout still blocks** at `PlaceOrder.jsx` (`if (!token) navigate("/login")`). Indian D2C loses COD orders from casual buyers.

| # | Deliverable |
|---|-------------|
| G1.1 | `placeOrder` accepts guest payload: full address + phone + email (no `userId`) |
| G1.2 | Order model: `userId` optional; `guestEmail` / `guestPhone` on order or address |
| G1.3 | `PlaceOrder.jsx`: “Continue as guest” path; no forced login |
| G1.4 | Post-order: “Create account to track order” optional (email + password) |
| G1.5 | Admin orders: guest orders visible; search by phone/email works (already on list) |
| G1.6 | Customer 360 note unchanged — guest orders not on user profile until linked |

**Exit:** Browse → cart → COD checkout without account.

**Effort:** Medium (touches order controller, auth, PlaceOrder UI).

**Not in G1:** Guest wishlist (still login-only) — acceptable.

---

## Part 6 — Master roadmap

| Step | Phase | Depends on | Effort |
|------|-------|------------|--------|
| 1 | **V1** Variant linking | — | S–M |
| 2 | **S1** Size matrix (stock + price) | V1.1–V1.3 | M |
| 3 | **V2** Grouped admin + add colour | S1 grid UI | M |
| 4 | **S2** Shop dedupe | V1 + S1 | M |
| 5 | **O1** Order snapshots | V1 | S |
| 6 | **P1** Policy CMS | — (can parallel step 3–4) | S–M |
| 7 | **G1** Guest checkout | S1 cart price validation | M |
| 8 | Migration script + cleanup UI | V1 + S1 | S–M |

**Critical path:** V1 → S1 → V2 → S2 → O1.  
**Parallel tracks:** P1 anytime after settings patterns exist; G1 after S1 pricing on cart is correct.

---

## Part 7 — Migration (existing catalogue)

1. **Audit script** — orphan styles, duplicate colours, shop duplicates, products with uniform price (ready for size matrix).
2. **Auto-fix** — sync `secondaryName` within `parentId` groups.
3. **Size matrix bootstrap:**
   - `One Size` → one row: current price, oldPrice, qty.
   - Multi-size → one row per size in `sizes[]`; copy same **price** to each row; put all **stock** on first size OR split evenly with admin warning (prefer manual review for multi-size).
4. **Primary listing** — script marks `isPrimaryListing` on one colour per style; admin confirms.
5. **Compat layer** — keep `price` / `availableQuantity` computed until all clients use matrix.

---

## Part 8 — Acceptance criteria

### Variants & colours

- [ ] Add second colour to a style in ≤ 3 clicks; size/prices pre-filled.
- [ ] PDP swatches by `parentId`; current colour highlighted.
- [ ] Shop: one card per style; hidden primary rolls to next colour.
- [ ] Duplicate creates new style; no duplicate `(parentId, color)`.

### Size matrix

- [ ] Admin sets **price and stock per size** in one grid.
- [ ] **Same prices across colours** by default when adding colour (editable per colour only if needed).
- [ ] PDP price updates when size changes; OOS sizes disabled.
- [ ] Checkout uses size price; stock decrements per size.

### Orders

- [ ] Packing slip: name · colour · size · SKU · price.

### Policy CMS

- [ ] Edit shipping/returns in admin; `/policy/shipping` reflects changes without deploy.

### Guest checkout

- [ ] Guest completes COD order with phone + address; order in admin; optional account creation after.

---

## Part 9 — Explicitly dropped

- Staff roles / packer permissions  
- Admin 2FA  
- Activity log  
- Low-stock email/WhatsApp digest  
- Dashboard date-range API  
- Bulk product CSV import/export  
- Invoice PDF beyond packing slip  
- Per-colour price overrides (v1)  
- Per-size SKU codes (v1)  

---

## Part 10 — File map

| Area | Files |
|------|--------|
| Product schema | `backend/models/productModel.js` |
| Products API | `backend/controllers/productController.js` |
| Orders | `backend/controllers/orderController.js`, `backend/models/orderModel.js` |
| Settings / policies | `backend/models/SiteSettings.js`, `backend/routes/settingsRoutes.js` |
| Admin catalog | `admin/src/pages/Add.jsx`, `Edit.jsx`, `List.jsx` |
| Admin settings | `admin/src/pages/Settings.jsx` (Policies tab) |
| Storefront PDP | `frontend/src/pages/Products.jsx`, `SimilarColorProducts.jsx` |
| Storefront shop | `frontend/src/pages/Shop.jsx`, `ShopContext.jsx` |
| Checkout | `frontend/src/pages/PlaceOrder.jsx`, `Cart.jsx` |
| Policies | `frontend/src/pages/Policy.jsx` |

---

## Part 11 — What we are NOT doing

- Full ERP colour × size SKU matrix  
- Shopify-style option sets  
- AI colour detection  
- Automatic price rules by size (all manual grid entry)  

---

## Part 12 — Start here

**First implementation PR: Phase V1** (variant linking — unblocks everything else).

Then **S1** (size matrix — stock + price per size).

Policy CMS (**P1**) and guest checkout (**G1**) slot in per master roadmap above.

---

*Plan finalised 20 Aug 2026. Zayn confirmed pricing: same across colours, varies by size (manual grid).*

# Zayn Leathers — Admin panel enhancement plan

**Purpose:** A complete list of what is missing or painful in the **admin** (`admin/` Vite app + admin APIs), based on the current codebase. Pair this with `docs/UX_ENHANCEMENT_PLAN.md` (storefront). Do not rebuild the panel; fix daily operations first.

**Last reviewed:** 19 August 2026

## Implementation status

**Phase A–E shipped (19 Aug):**

- **A:** Order detail `/orders/:id`, search, copy address, confirm status, session expiry, 7-day Remember me
- **B:** Apparel dashboard labels, product search/low stock/hide, Settings honesty, review token
- **C:** Contacts inbox, coupons, product-review moderation, list thumbs + lightbox
- **D:** Customer 360 `/users/:id`; user search by email/phone; returns / RTO / cancelled-today filters + return reason
- **E:** Duplicate product; SKU / SEO title / image alt; 8 gallery slots; inline qty save; orders CSV; packing slip print; mobile nav drawer; unique sidebar icons
- **WhatsApp click-to-chat:** admin-only `wa.me` templates (order status + customer hello). No WhatsApp Business API. Message opens in WhatsApp; admin taps Send.

P2 remaining: staff roles, 2FA, stock-per-size, activity log.

**Phase C (19 Aug):** contact inbox (read/unread, notes, mail/WhatsApp/delete); coupons (min order, pause, used count, confirm delete); product-review moderation. List thumbs + lightbox; edit keeps current images and fields after save.


---

## How to read this file

| Priority | Meaning |
|----------|---------|
| **P0** | Owner cannot run the shop safely day-to-day (orders, stock, login, leftover tote copy). |
| **P1** | Expected on any serious Indian D2C admin. |
| **P2** | Scale, roles, analytics, extras. Do after P0–P1. |

Each item: **today**, **why it hurts**, **the fix**.

---

## What already works (do not rebuild)

- Admin login (`POST /api/user/admin`) against `ADMIN_EMAIL` / `ADMIN_PASSWORD`; JWT **1 day**, `role: admin`.
- **Dashboard:** counts, revenue, payment mix, status mix, recent orders, charts (`GET /api/order/dashboard`).
- **Catalog:** add / list / edit / delete products; Cloudinary images; categories tree; featured / bestseller.
- **Orders:** list, search (name / id), status per line item, Shiprocket create/track/label when `SHIPPING_ENABLED`, partial-pay collect/refund when that feature is on.
- **Coupons:** create (% off + expiry + usage limit), list, delete.
- **Users:** table of registered customers (name, email, phone, verified).
- **Contacts:** list messages from the storefront form.
- **CMS:** hero banners (4 slots), Instagram promos, homepage video “reviews”, Settings (fees, COD, promo strip, home sections, category tiles).
- Token on most admin calls is the `token` **header** (not Bearer). Users page uses `Authorization: Bearer` — both work only if the backend accepts them; keep one style later.

---

## Honest scope

There **is** more work on admin than on the remaining storefront P1 items, but it is **not** a new product. The panel already covers sell / pack / CMS. Gaps are: **order ops**, **customer 360**, **stock**, **moderation**, **session**, and **Zayn leftover copy** (dashboard still says “tote”).

Razorpay / Shiprocket UI can stay; it is gated when those env flags are off.

---

## P0 — Daily operations (do first)

### P0.1 — Orders are a long card list, not a packing desk

**Today**

- `POST /api/order/list` returns **all** orders; admin paginates in the browser (10 per page).
- Search is first/last name, Mongo `_id`, leftover `orderType`. **Not** phone, email, pincode, or product name.
- Address is one cramped line. No copy-to-clipboard, no `tel:` / WhatsApp, no print/invoice.
- Status is a **dropdown that saves immediately** (`statusHandler`) — no confirm. Easy to mark Shipped by mistake.
- No dedicated `/orders/:id` admin page (storefront customers have `/orders/:id`; admin does not).

**Why it hurts**

COD leather orders need phone + full address on screen, copy-paste for Shiprocket/manual courier, and fewer mis-clicks.

**Fix**

1. Admin **order detail** route (`/orders/:id`): full address, items, payment, notes, status with **confirm modal**, copy address / copy order id, call / WhatsApp.
2. Search: phone, email, last 6 of id, product name.
3. Server-side pagination + filters (`status`, `paymentMethod`, date range) so the list stays fast.
4. Optional print stylesheet or simple invoice PDF later (P1).

---

### P0.2 — Admin session dies silently after 1 day

**Today**

- Admin JWT expires in **1 day**. Token stays in `localStorage`.
- No 401 interceptor. Failed APIs toast “Not Authorized”; the shell still looks logged in until they click Logout.
- Login has no “remember me”; password manager only.

**Fix**

- On any admin 401 / “Login Again”: clear token, send to login, toast “Session expired”.
- Optional: 7-day admin JWT behind a checkbox, or a ping `GET /api/user/admin/me` on boot.

---

### P0.3 — Dashboard still speaks “totes”

**Today**

- API returns `toteRevenue` / `toteOrders` aliases plus apparel/bags/accessories.
- Dashboard UI still charts **Tote vs Accessories** (old Totezie/Afiya split). Leather is men / women / bags / accessories.

**Fix**

- Relabel charts: Apparel (men+women) / Bags / Accessories (or four departments).
- Drop tote copy in the UI. Keep API aliases until the frontend is updated.

---

### P0.4 — Product list is weak for restocking

**Today**

- Department chips + pagination. Qty column exists.
- No search by name. Empty copy is **“Nothing”**.
- No sort by stock. No “low stock” filter (e.g. qty ≤ 5).
- Delete has confirm; there is **no hide / unpublish**. Delete is the only way to take a SKU off the shop.
- Edit navigates with `state: item`; refresh on edit can lose payload if not refetched by id.

**Fix**

1. Search box (name, color, category).
2. Highlight qty ≤ threshold; filter “Low stock”.
3. `status` or `isActive` on product (already a `status` string on the model, unused). Use it for hide vs delete.
4. Edit always `GET /api/product/:id`.
5. Duplicate product (clone + new images optional) — listed in storefront plan P2; it belongs here as P0.4 or P1.

---

### P0.5 — Two “review” systems; admin only handles videos

**Today**

- **Admin → Upload Review:** homepage **video** UGC (`/api/reviews/upload`). Storefront home carousel. Upload request in `Review.jsx` **does not send the admin token**; the route uses `adminAuth`. Upload likely **fails** unless something else injects the header.
- **PDP star reviews:** `POST /api/reviews` with name/comment/rating, **no login**, **no moderation**, **no admin list**. Anyone can post fake reviews.

**Fix**

1. Send `token` on video upload (bugfix).
2. Admin page for **product reviews**: list, hide/delete, optional “verified purchase” later.
3. Require login (or order id) to post a PDP review — storefront + admin together.

---

### P0.6 — Settings vs reality (COD / partial / promo)

**Today**

- Settings UI still exposes **partial payment** defaults (`active: true`, replace COD). Live shop is **COD only** via env (`PARTIAL_PAYMENT_ENABLED=false`, Razorpay empty).
- Promo strip lives in **Mongo**. Rebrand does not overwrite it until they **Save** in Settings (same as storefront P1.10).
- Contact/phone for Zayn is **not** in Settings; it is `shared/brands/zayn-leathers.js`. Admin cannot fix an empty footer.

**Fix**

- Settings: show a banner “Online pay / partial / Shiprocket: off in `.env`” so the owner does not think the toggles are live.
- One-click “reset promo to Zayn copy” or save once as part of handover.
- Optional later: contact fields in Settings (overrides brand file) — P1.

---

## P1 — Expected D2C admin

### P1.1 — Customer 360 (not only a user table)

**Today:** `Users.jsx` is a flat table. No click-through. `getAllUsers` does not return addresses, order count, or last order.

**Fix**

- `/users/:id`: profile, addresses, orders for that `userId`, cart/wishlist counts (read-only).
- Search users by email / phone.
- Do **not** show password hashes (already excluded).

---

### P1.2 — Contacts inbox

**Today:** list only. No read/unread, no delete, no “replied”, no mailto.

**Fix:** mark read, delete, `mailto:` / WhatsApp buttons, optional note field.

---

### P1.3 — Coupons that match real campaigns

**Today:** percent + expiry + usage limit. No min order, no “first order only”, no used-count in UI (`usedBy` exists on the model). Delete only — no disable. Create has no confirm.

**Fix:** show used / remaining; min cart value; toggle active; confirm delete.

---

### P1.4 — Returns / cancellations queue

**Today:** mixed into the giant order list. Customer can request return (Shiprocket path). Admin has no “Returns” filter tab beyond status chips.

**Fix:** filter **ReturnRequested / RTO / Cancelled today**; show reason if stored.

---

### P1.5 — Catalog quality

- Duplicate product.
- Image **alt** / SEO title on product (storefront P2).
- More than 4 gallery images if needed (current add form is 4 + 2 size charts).
- Bulk qty adjust (small CSV or “set stock” on list row).
- SKU / style code field (optional; helps packing).

---

### P1.6 — Export and print

- CSV/Excel of orders (date range) for accountant / GST.
- Print packing slip from order detail.

---

### P1.7 — Admin UI chrome

- Mobile: sidebar is a shrinking column (`w-20`), not a drawer; packing on a phone is poor.
- Same page padding language (Orders uses a nested `min-h-screen` inside `main` which already scrolls — double chrome).
- Sidebar icons are reused `order_icon` for almost every link.
- `console.log` of the admin token on Dashboard fetch — remove (security hygiene).

---

### P1.8 — Auth header consistency

**Today:** mix of `{ token }` header and `Authorization: Bearer`. `adminAuth` reads `req.headers.token` only.

**Fix:** Users (and any Bearer-only calls) must send the `token` header, **or** `adminAuth` should also accept `Authorization`. Pick one and use it everywhere.

---

### P1.9 — Policies and content

Policies on the shop are static pages. Admin cannot edit shipping/returns copy. Fine for launch; add Settings markdown or a Policy CMS if Zayn wants to change copy without a deploy.

---

### WhatsApp click-to-chat (manual)

**How it works:** `https://wa.me/91XXXXXXXXXX?text=...` with a filled template. No WhatsApp Cloud API, no auto-send on status change.

**Where:** Orders list (WhatsApp button → composer), order detail (always-on panel), customer 360 (welcome / last-order hello).

**Templates:** confirmed, packing, shipped (AWB + tracking if present), out for delivery, delivered, cancelled, RTO, return stages, plus a full summary. Admin can edit the text, then **Open WhatsApp** and tap Send in the app.

---

## P2 — Later

### Operations

- Staff roles (owner vs packer: packer cannot delete products or change settings).
- Activity log (who changed status).
- Low-stock email/WhatsApp digest.
- Dashboard date range (week / month / custom) — timeframe UI exists; confirm it hits the API correctly.

### When Razorpay / Shiprocket are on

- Clear admin copy: COD vs prepaid vs partial.
- Failed payment orders vs paid.
- AWB / label errors shown in plain language.

### Product data model

- Stock **per size** (today one `availableQuantity` for all sizes).
- Variants (same parent, different color) already use `parentId` / `secondaryName` — document how to use it in admin so they do not duplicate blindly.

### Security

- 2FA for admin (optional).
- Do not log JWTs.
- Video review upload must always be authenticated (P0.5).
- Rate-limit admin login (customer auth already has limiters).

### Not needed unless asked

- Full Shopify-like analytics.
- Multi-admin OAuth.
- Replacing the admin with a new framework.

---

## Suggested build order

| Phase | Scope | Outcome |
|-------|--------|---------|
| **A — Pack the order** | P0.1, P0.2, P0.8 headers | Find order, copy address, confirm status, session expires cleanly |
| **B — Catalogue truth** | P0.3, P0.4, P0.6 | Leather dashboard, search/stock/hide, Settings honesty + Zayn promo save |
| **C — Trust & inbox** | P0.5, P1.2, P1.3 | Reviews moderated, contacts usable, coupons understandable |
| **D — Customer 360** | P1.1, P1.4 | Click a user / return queue |
| **E — Scale** | P1.5–P1.7 | Duplicate, export, print, mobile nav (roles = P2) |

---

## Phase A acceptance

The owner should be able to:

1. Search an order by **phone** and open a **detail** page with full address.
2. Copy address in one click; change status only after **confirm**.
3. After JWT expiry, land on login with a clear message — not a half-broken dashboard.
4. Not see “Tote” as a business category.

---

## Out of scope unless you ask

- New admin framework / Shopify clone.
- Google login for **admin** (storefront Google login is separate and postponed).
- Turning Razorpay/Shiprocket on (env + keys; UI mostly exists).
- Guest checkout (storefront).

---

## Code map

| Area | Files |
|------|--------|
| Shell | `admin/src/App.jsx`, `Navbar.jsx`, `SideBar.jsx`, `Login.jsx` |
| Auth | `backend/middleware/adminAuth.js`, `userController.js` `adminLogin` |
| Dashboard | `admin/src/pages/Dashboard.jsx`, `orderController.js` dashboard handler |
| Orders | `admin/src/pages/Orders.jsx`, `backend/controllers/orderController.js`, `adminOrderController.js` |
| Products | `Add.jsx`, `Edit.jsx`, `List.jsx`, `productController.js` |
| Users | `Users.jsx`, `UserDetail.jsx`, `getAllUsers`, `getAdminCustomer` |
| Settings / CMS | `Settings.jsx`, `HeroUpload.jsx`, `InstagramPromos.jsx`, `Review.jsx`, `SiteSettings.js` |
| Coupons / contacts | `Coupon.jsx`, `Contacts.jsx` |

---

## Decision needed before coding Phase A

1. **Order detail as a new page**, or expand the existing card (new page is cleaner)?
2. **Hide product** vs only delete — hide is safer for Zayn.
3. **Admin JWT:** keep 1 day, or 7 days with remember me?

Once those three are answered, Phase A is straightforward against this file.

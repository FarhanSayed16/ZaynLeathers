# Zayn Leathers — UX & product enhancement plan

**Purpose:** A single list of what is missing or broken in the customer experience, based on the current codebase (not a wish list of unrelated features). Use this to decide what to build, in order.

## Implementation status (19 Aug 2026)

Phase 1 + guest cart + address book are **in the codebase**:

- Guest cart in `localStorage`, merged on login (`POST /api/cart/merge`)
- Address book on the user (up to 5), Account page at `/account`, checkout prefill
- JWT **30 days** by default, **90 days** with Remember me
- Session expiry clears token and asks to sign in
- Nested cart uses `markModified('cartData')`
- Mobile account icon + Account / Orders / Logout

**Also shipped 19 Aug (later pass):** global search → `/shop?q=`, PDP breadcrumbs / size guide / trust line / sticky mobile add-to-cart / recently viewed, buy again on order detail, change password on Account, register honors checkout redirect, public coupon hints on cart.

P1 remaining: Zayn contact details (needs real phone/email), guest checkout without login.


**Last reviewed:** 19 August 2026

---

## How to read this file

| Priority | Meaning |
|----------|---------|
| **P0** | Customers feel the shop is broken. Do these first. |
| **P1** | Expected on any serious Indian D2C store. |
| **P2** | Polish, conversion, and trust. Do after P0–P1. |

Each item has **what happens today**, **why it hurts**, and **the fix**.

---

## What already works (do not rebuild)

- Customer accounts exist in Mongo (`User`: name, email, phone, password, OTP verify).
- JWT is stored in `localStorage` and lasts **7 days** (`createToken` in `userController.js`).
- Cart and wishlist **are** stored on the user document (`cartData`, `wishlist`) **after login**.
- Orders store a full shipping address **on that order only**.
- `GET /api/user/profile` exists on the backend.

The problems below are mostly: **the frontend never uses the profile**, **addresses are never saved back to the user**, **guests are blocked**, and **session failures are silent**.

---

## P0 — Account, session, and checkout (do first)

These match what you noticed: login friction, empty checkout, data that does not come back.

### P0.1 — Shipping address is not saved on the customer

**Today**

- `User` schema has **no** `addresses` / `defaultAddress` field.
- Checkout (`PlaceOrder.jsx`) always starts with empty fields (`firstName`, `street`, `city`, `zipcode`, …).
- Address is written only onto the **order** at place-order time.
- The next visit, the form is blank again.

**Why it hurts**

Repeat buyers retype the same address every order. That feels amateur and causes drop-off.

**Fix**

1. Add on `User`:
   - `addresses[]`: label, firstName, lastName, phone, email, street, apartment, city, state, zipcode, country, `isDefault`.
   - Cap at a small number (e.g. 5).
2. On successful order, **upsert** that address onto the user (or save if they tick “Save this address”).
3. Checkout:
   - Load saved addresses.
   - Pre-select default.
   - Allow “use a new address”.
   - Prefill name / phone / email from profile even when they have never ordered.
4. Optional first version (faster): if no address book yet, prefill from **last order’s** `address`. Still better than a blank form.

**API sketch**

- `GET /api/user/profile` — already returns the user; extend with addresses.
- `PUT /api/user/profile` — name, phone.
- `GET/POST/PUT/DELETE /api/user/addresses` — or nest under profile.

---

### P0.2 — Profile API exists; the shop never calls it

**Today**

- Backend: `GET /api/user/profile` (auth required).
- Frontend: **zero** calls to `/api/user/profile`.
- Navbar only has Orders + Logout. No Account page.
- Checkout does not fill name, email, or phone from the account (even though those fields exist on `User`).

**Why it hurts**

The account feels like “login to unlock cart”, not a real account. Data looks unsaved even when it is in Mongo.

**Fix**

- On app load, if a token exists, fetch profile into `ShopContext` (`user`).
- New page: **`/account`** (and `/account/addresses`, or tabs on one page).
- Prefill checkout from `user` + default address.
- Show first name in the header (“Hi, Farhan”) so the session feels real.

---

### P0.3 — Session looks logged out or “empty” even when a token exists

**Today**

- Token lives in `localStorage`; React reads it on boot. Refresh **should** stay logged in for up to 7 days.
- There is **no** refresh token.
- There is **no** axios interceptor. When JWT expires, APIs return `{ success: false, message: "Invalid or expired token" }` but the UI often still shows a user icon.
- Cart/wishlist hydrate only when `token` is set; failed hydrates are easy to miss.
- Admin JWT is **1 day**; customer is **7 days**. Neither is explained in the UI.

**Why it hurts**

After expiry (or a bad token), cart/orders fail until they log in again. It feels like “the backend does not store my data”.

**Fix**

1. On boot: call `/api/user/profile`. If unauthorized → clear token, clear cart in memory, toast “Session expired — please sign in”.
2. Axios interceptor on 401 / “Invalid or expired token” → same logout path.
3. Persist token only after a successful profile fetch (or keep token but mark `authStatus: 'ready' | 'expired'`).
4. Optional: **Remember me** — 30-day JWT if checked, 7-day (or session) if not.
5. Optional later: refresh tokens. Not required for P0 if expiry is handled cleanly.

**Note:** A hard refresh with a **valid** token should already restore cart/wishlist from Mongo. If it does not, see P0.4.

---

### P0.4 — Nested cart may not persist in Mongo (real save bug)

**Today**

- `cartData` is `{ type: Object }` (Mongoose Mixed).
- `addToCart` / `updateCart` mutate nested keys then `save()`.
- There is **no** `markModified('cartData')`.

**Why it hurts**

Mongoose often **does not see** nested object mutations. Cart can look fine in the tab, then vanish after refresh or another device. That matches “data is not stored in the backend”.

**Fix**

- After any cart mutation: `user.markModified('cartData'); await user.save();`
- Or store cart as a proper subdocument array: `{ productId, size, quantity }[]` (cleaner long-term).
- Add a smoke test: add item → restart backend → GET cart still has the item.

---

### P0.5 — Guest shoppers cannot use cart (login wall)

**Today**

- `addToCart` requires login and redirects to `/login`.
- Wishlist same.
- Checkout requires login.

**Why it hurts**

People browse, try Add to cart, get bounced. Many never return. Address pain is then the second insult.

**Fix (recommended for conversion)**

1. **Guest cart** in `localStorage` (same `{ productId: { size: qty } }` shape).
2. Allow browse + cart **without** login.
3. At checkout: “Continue as guest” **or** login/register.
4. On login: **merge** guest cart into `user.cartData` (server-side merge).
5. Wishlist can stay login-only for P0, or same guest pattern.

If you want a smaller first slice: keep login for checkout only, but **do not** block Add to cart.

---

### P0.6 — Checkout form UX

**Today**

- All fields empty; country is a free-text box.
- Pincode serviceability exists (good) but only if Shiprocket is on; it is currently **off**.
- No “same as last order”.
- Default payment is COD (Razorpay off) — fine for now.
- Phone is `type="number"` (leading zeros / country codes break).

**Fix**

- Prefill from profile + default address (P0.1–P0.2).
- India: state dropdown, 6-digit pincode, phone as `tel` with 10-digit validation.
- Optional: pincode → city/state lookup (India Post / a small pin dataset).
- Disable Place order until address is valid; show one clear error list, not only toasts.
- After order: confirmation page with address recap and “Save this address” if they used a new one.

---

### P0.7 — Account menu is weak on mobile

**Today**

- Desktop: hover for Orders / Logout.
- Mobile header has **no** account icon in the compact bar (search + cart only). Profile is buried in the slide-out, hover menus do not work on touch.

**Fix**

- Always-visible account entry on mobile.
- Tap menu: Account, Orders, Addresses, Logout (and Login if logged out).
- Do not rely on hover.

---

## P1 — Expected store features

### P1.1 — Real Account area

| Screen | Contents |
|--------|----------|
| Overview | Name, email, phone, edit |
| Addresses | List, default star, add/edit/delete |
| Orders | Already exists at `/orders` — link it from Account |
| Security | Change password (logged-in), not only forgot-password email |

No My Account today except a hover menu.

### P1.2 — Order history UX

**Today:** `/orders` lists orders if you are logged in; there is no empty state that sends you to login vs shop; tracking stages are local; AWB / courier link from Shiprocket may not be obvious to the customer.

**Fix:** Empty states (“Sign in to see orders” / “No orders yet — Shop”). Order detail page (`/orders/:id`) with address, items, status, tracking URL when present. Copy order id. Return/cancel copy in plain language.

### P1.3 — Stock and sold-out

Show sold-out on cards and PDP; disable Add to cart; waitlist optional later. Avoid placing orders for qty above `availableQuantity` (enforce on **server** at place-order).

### P1.4 — Search and shop filters

Shop has department chips, category, color, material, sort, pagination. Enhancements: search results page that is not only the overlay; “no results” with clear filters; persist filters in URL (department/category already partly URL-based); mobile filter drawer that is easy to close.

### P1.5 — PDP (product page)

Image zoom exists. Add: size guide (jackets vs bags), selected size sticky on mobile, out-of-stock per size, “notify me”, share links using Zayn brand (not leftover socials). Trust line: COD / returns / shipping days once policy is written.

### P1.6 — Empty and error states

Cart empty, wishlist empty (already partly there), 404 page, API down, images failed. One illustration + one CTA each.

### P1.7 — Auth UX

- Stay on login after failed OTP with resend countdown (register already has OTP).
- Remember email locally.
- After register, land on shop or the `redirectAfterLogin` URL (already used for login).
- “Continue with Google” is **P2** (needs extra vendor). Not required for P0.

### P1.8 — Policy pages (trust)

Scope mentioned Privacy / Shipping / Refund placeholders. Footer has **no** policy links. Add:

- `/shipping-policy`
- `/return-refund`
- `/privacy`
- `/terms`

Admin-editable later; static markdown/pages are enough for launch.

### P1.9 — Contact and brand for Zayn

Zayn brand config currently has **empty** phone, email, address, socials. Contact page and footer look unfinished. Fill real Zayn details when you have them. Map embed optional.

### P1.10 — Promo strip and site settings leftovers

Homepage promo in Mongo may still say the old brand until saved in Admin → Settings. After any rebrand, open Settings and save once.

---

## P2 — Conversion, polish, admin

### Storefront

- Recently viewed products.
- “Buy again” from order history.
- Coupons: show applicable codes on cart (not only a blank input).
- Free-shipping progress bar (“₹X more for free delivery”) using `freeShippingThreshold`.
- Reviews: verified-purchase flag; photos; moderate in admin (review upload exists for video/home).
- Breadcrumbs on shop/PDP.
- Skeleton loaders everywhere products load (some exist).
- Accessibility: focus states, alt text, form labels (many exist; audit).
- 404 and maintenance page.

### Payments & shipping (when you turn them back on)

- Razorpay + COD side by side with clear copy.
- Partial pay explained in one sentence + policy.
- Saved cards are Razorpay’s problem; you only need a stable customer id later.
- Show estimated delivery on PDP/cart when Shiprocket is enabled.

### Admin

- Same address shown clearly on order; copy-to-clipboard.
- Customer profile from admin (orders by user, not only a user list).
- Low-stock report.
- Duplicate product.
- Image alt / SEO fields on product.
- Confirm before status jumps (some modals exist).

### Technical hygiene that affects UX

- CORS / env already local.
- Rate limits on auth — keep; show “try again in X minutes”.
- Image CDN (Cloudinary) already used; consistent transforms for cards vs zoom.
- Sitemap/robots still point at localhost from the Zayn rebrand — fix before public launch.

---

## Suggested build order

Do **one slice that the customer can feel**, then the next.

| Phase | Scope | Outcome |
|-------|--------|---------|
| **1 — Remember me (data)** | P0.1, P0.2, P0.3, P0.4, P0.6, P0.7 | Login lasts; cart survives refresh; checkout prefilled; addresses saved; mobile can reach account |
| **2 — Shop without nagging** | P0.5 | Guest cart + merge on login |
| **3 — Account home** | P1.1, P1.2 | Proper My Account + order detail |
| **4 — Trust** | P1.8, P1.9, P1.10 | Policies, Zayn contact, promo copy |
| **5 — Catalogue polish** | P1.3–P1.6 | Stock, search, empty states, PDP |
| **6 — Later** | P2 | Payments back on, extras |

---

## Phase 1 acceptance (when we build it)

A returning customer should be able to:

1. Open the site tomorrow (within JWT lifetime) and still be logged in **or** get a clear “session expired” and one-tap login — never a silent empty cart.
2. See their cart after refresh (Mongo actually updated).
3. Open checkout and see **name, phone, email, and last/default address** already filled.
4. Place a second order without typing the street again (or pick from saved addresses).
5. Open Account from mobile and see profile + addresses + orders.

---

## Out of scope for this plan (unless you ask)

- Native apps.
- Multi-brand SaaS.
- Replacing Mongo/Cloudinary.
- Rewriting the admin from scratch.
- Ads / SEO campaigns.
- Turning Razorpay/Shiprocket on (separate when you are ready).

---

## Code map (for whoever implements Phase 1)

| Area | Files |
|------|--------|
| User schema | `backend/models/userModel.js` |
| Auth JWT | `backend/controllers/userController.js` (`createToken`), `backend/middleware/auth.js` |
| Profile GET only | `backend/routes/userRoute.js`, `getUserProfile` |
| Cart save | `backend/controllers/cartController.js` |
| Checkout form | `frontend/src/pages/PlaceOrder.jsx` |
| Session + cart hydrate | `frontend/src/context/ShopContext.jsx` |
| Login persist | `frontend/src/pages/Login.jsx` |
| Header account | `frontend/src/components/Navbar.jsx` |
| Orders (read-only address) | `backend/models/orderModel.js`, `frontend/src/pages/Orders.jsx` |

---

## Decision needed from you before coding Phase 1

1. **Guest cart?** Yes (recommended) or login still required for Add to cart?
2. **Address book** (multiple) vs **one default address** for the first version?
3. **Remember me** checkbox, or just keep 7-day JWT and fix expiry handling?

Once those three are answered, Phase 1 is straightforward to implement against this file.

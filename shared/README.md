# Brand config

One file controls brand identity for frontend, admin, and backend.

**Active export:** `shared/brand.config.js` → re-exports `shared/brands/<client>.js`

**Current:** `shared/brands/zayn-leathers.js`

## Swap to another leather / apparel brand (client resale)

1. Copy `shared/brands/afiya-leathers.js` → `shared/brands/<new-client>.js` and edit identity/theme/copy.
2. Change `shared/brand.config.js` to re-export the new file.
3. Replace logo + media under `frontend/public/brand/` and `admin/public/brand/`.
4. Point env at a **new Mongo DB name** and set `CLOUDINARY_FOLDER` for that client.
5. Update `ADMIN_EMAIL` / `ADMIN_PASSWORD`, CORS URLs, Razorpay, Resend (`RESEND_API_KEY`, `EMAIL_FROM`).
6. Restart frontend, admin, and backend so Vite/Node pick up the config.

Full operator list: **`CLIENT_SWAP_CHECKLIST.md`**.

### Theme bridge

`applyBrandToDocument()` (frontend + admin) writes CSS variables. Tailwind `tz-*` tokens map to those variables, so changing `brand.theme.colors` re-skins CTAs, borders, and backgrounds without rewriting every class.

### Do not hardcode brand names in pages

Import `brand` from `@brand` (apps) or `../shared/brand.config.js` (backend).

Multi-tenant DB isolation is **not** in scope; this is **single-deploy brand swapping**.

## Current client

**Zayn Leathers** — identity in `shared/brands/zayn-leathers.js`. Product media still uses Cloudinary folder `afiya-leathers` and Mongo DB `afiyaleathers`.

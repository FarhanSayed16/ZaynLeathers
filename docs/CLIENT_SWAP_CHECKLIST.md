# Client swap checklist

Use this when reselling the monorepo to a new brand (single deploy per client — not multi-tenant).

## 1. Brand identity

- [ ] Create `shared/brands/<client-id>.js` (copy `afiya-leathers.js`)
- [ ] Point `shared/brand.config.js` at the new file
- [ ] Set `id`, `name`, `tagline`, contact, about copy, SEO, email subjects
- [ ] Set `theme.colors` + `theme.fonts`
- [ ] Set `catalog.nav` + search suggestions
- [ ] Set `commerce.razorpayDisplayName` + `commerce.cloudinaryFolder`

## 2. Public assets

- [ ] Replace `frontend/public/brand/` (logos, heroes, categories, lifestyle)
- [ ] Replace `admin/public/brand/` to match
- [ ] Update favicon + `index.html` title if hard-coded

## 3. Environment (never commit secrets)

| App | Key changes |
|-----|-------------|
| Backend | New `MONGODB_URI` DB name, `CLOUDINARY_FOLDER`, `ADMIN_EMAIL` / `ADMIN_PASSWORD`, CORS URLs, Razorpay, **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`), Shiprocket |
| Frontend | `VITE_BACKEND_URL`, `VITE_RAZORPAY_KEY_ID` |
| Admin | `VITE_BACKEND_URL` |

See `ENV_WHAT_YOU_NEED.md`.

## 4. Database + media

- [ ] New Mongo database name (never reuse another client's DB)
- [ ] New Cloudinary folder prefix
- [ ] Seed categories: `cd backend && npm run seed:categories:wipe`
- [ ] Seed admin-facing test users if needed: `npm run seed:users`
- [ ] Seed test coupon (optional): `npm run seed:coupon`
- [ ] Import or upload products for the new catalog

## 5. Commerce smoke test

- [ ] Admin login works
- [ ] Customer register / OTP (Resend) or seeded user login
- [ ] Add to cart → checkout COD
- [ ] Razorpay test payment
- [ ] Coupon apply
- [ ] Partial pay (if enabled in settings / env)
- [ ] Order status email subjects show new brand name

## 6. Deploy

- [ ] Frontend + admin + backend env on host (Vercel / Railway / etc.)
- [ ] CORS origins match production URLs
- [ ] Sitemap / robots domain updated
- [ ] Change default admin password before go-live

## Afiya Leathers — current test logins (local only)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@afiyaleathers.com` | `Afiya@Admin2026` (from `backend/.env`) |
| Customer | `customer@test.com` | `Test@1234` |
| Customer | `buyer@afiya.test` | `Test@1234` |
| Coupon | `AFIYA10` | 10% off |

Do **not** put these credentials in the public storefront.

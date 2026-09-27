# What you need for Zayn Leathers env

Secrets stay in `.env` (never commit). Copy from each package's `.env.example`.

## Ports (local)

| App | Default URL |
|-----|-------------|
| Frontend | http://localhost:5173 |
| Admin | http://localhost:5174 |
| Backend | http://localhost:4000 (or `PORT` in `backend/.env` — often **5000**) |

Match `VITE_BACKEND_URL` to whatever `PORT` the API actually uses.

## Admin login (local)

| Field | Value |
|-------|--------|
| Email | `admin@afiyaleathers.com` |
| Password | `Afiya@Admin2026` |
| Admin app | http://localhost:5174 |

Change `ADMIN_PASSWORD` before any public deploy.

## MongoDB

Same Atlas cluster is fine; database name must be **`afiyaleathers`** (URI path). Old `clothes` / Totezie DBs are left untouched.

## Cloudinary

```env
CLOUDINARY_FOLDER=afiya-leathers
```

Product uploads go under `afiya-leathers/products`.

## Transactional email (OTP + forgot password + orders)

**Production (Render): Resend HTTP API** — do not rely on Gmail SMTP.

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="Afiya Leathers <orders@afiyaleathers.com>"
ALLOW_DEV_OTP=false
```

1. Create an account at [resend.com](https://resend.com).
2. Verify domain `afiyaleathers.com` (SPF/DKIM DNS). Until then, testing only works with Resend’s sandbox from-address to your own inbox.
3. Set the vars on **Render**, then redeploy.
4. `FRONTEND_URL` / `ADMIN_URL` must be the live site URLs (password-reset links).

**Local optional fallback:**

```env
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
```

If `MAIL_PROVIDER` is unset, the mailer uses Resend when `RESEND_API_KEY` is present, otherwise SMTP.

## Frontend / Admin

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

Admin needs `VITE_BACKEND_URL` only (same API).

## Razorpay / Shiprocket / partial pay

Configured in `backend/.env` — see `backend/.env.example`. Partial pay also has admin Site Settings toggles.

## Test accounts (seeded)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@afiyaleathers.com` | from `ADMIN_PASSWORD` |
| Customer A | `customer@test.com` | `Test@1234` |
| Customer B | `buyer@afiya.test` | `Test@1234` |
| Coupon | `AFIYA10` | 10% |

```bash
cd backend
npm run seed:categories:wipe
npm run seed:users
npm run seed:coupon
# optional products (needs organized_images/ locally):
# npm run seed:products:wipe
```

## Next client

Follow `CLIENT_SWAP_CHECKLIST.md` and `shared/README.md`.

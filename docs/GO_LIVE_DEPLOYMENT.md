# Afiya Leathers — production deploy plan

Use this as the only checklist. Do the steps **in order**.

| Piece | Host | URL (target) |
|:---|:---|:---|
| Customer shop | **Vercel** | `https://afiyaleather.com` |
| Admin panel | **Vercel** | `https://admin.afiyaleather.com` *(or your Vercel admin URL)* |
| API / backend | **Render** | `https://YOUR-SERVICE.onrender.com` |
| Domain DNS | **Hostinger** | `afiyaleather.com` |
| Mail | **Resend** | from `orders@afiyaleather.com` |

Secrets live in **local** `backend/.env`, `frontend/.env`, `admin/.env`. Copy them into dashboards. **Never commit `.env` files.**

---

## 0. Before you touch hosting

1. Commit and push the latest code to GitHub (the branch Vercel and Render deploy from).
2. Confirm Resend domain **afiyaleather.com** is **Verified**.
3. Keep Hostinger **Resend DNS** records (`resend._domainkey`, `send` TXT, `send` MX). Do not delete them when you change the A record.

---

## 1. Render — backend (do this first)

You need the **public API URL** before Vercel env will work.

### 1.1 Service settings

| Setting | Value |
|:---|:---|
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |
| Instance | At least a paid instance if the free tier sleeps (OTP/checkout will time out on sleep) |

Render sets `PORT` itself. Do **not** force `PORT=5000` on Render.

### 1.2 Wipe and re-import env (Render)

If old Gmail SMTP / wrong URLs are already there:

1. Render → your **web service** → **Environment**.
2. Delete leftover mail vars you no longer use, or delete **all** env vars if you want a clean import.
3. **Add** (or **Bulk edit** / paste) the list in **§1.3**.
4. Save → **Manual Deploy** → **Deploy latest commit**.
5. Open the service URL. You should see: `API Working properly`.
6. Copy that URL (no trailing slash). Example: `https://afiya-backend.onrender.com`.

### 1.3 Render env — paste list

Copy **secret values** from local `backend/.env`.  
Use these **exact production URLs** (not localhost).

```env
NODE_ENV=production
ALLOW_DEV_OTP=false

MONGODB_URI=
JWT_SECRET=

FRONTEND_URL=https://afiyaleather.com
ADMIN_URL=https://admin.afiyaleather.com
CORS_ORIGINS=https://afiyaleather.com,https://www.afiyaleather.com,https://leathers-brand.vercel.app,https://leathers-brand-frontend.vercel.app


ADMIN_EMAIL=
ADMIN_PASSWORD=
PARTNER_EMAIL=

CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=
CLOUDINARY_FOLDER=afiya-leathers

MAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=Afiya Leathers <orders@afiyaleather.com>
EMAIL_REPLY_TO=afiyaleather8@gmail.com

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SHIPPING_ENABLED=true
SHIPPING_PARTNER=shiprocket
SHIPPING_DYNAMIC_RATES=false
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_PICKUP_LOCATION=Primary
SHIPROCKET_RETURN_LOCATION=Primary
SHIPROCKET_PICKUP_PINCODE=400017

PARTIAL_PAYMENT_ENABLED=true
PARTIAL_PAYMENT_PERCENT_DEFAULT=25
PARTIAL_PAYMENT_MIN_PERCENT=10
PARTIAL_PAYMENT_MAX_PERCENT=50
PARTIAL_PAYMENT_MIN_ADVANCE=50
```

Fill every blank from `backend/.env`.

**If admin is not on `admin.afiyaleather.com` yet:**  
Put the current Vercel admin URL in `ADMIN_URL` and add it to `CORS_ORIGINS` (no trailing slash).

Optional SMTP vars are **not required** on Render (Resend is the mailer).

### 1.4 Render smoke test

```text
https://YOUR-SERVICE.onrender.com/
https://YOUR-SERVICE.onrender.com/api/product/list
https://YOUR-SERVICE.onrender.com/api/categories/tree
```

List and tree should return JSON. If they 404 or spin forever, do not continue to Vercel.

---

## 2. Vercel — frontend (shop)

### 2.1 Project settings

| Setting | Value |
|:---|:---|
| Root directory | `frontend` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 20.x if asked |

Connect the same GitHub repo. Production branch = `main` (or whatever you use).

### 2.2 Wipe and re-import env (Vercel frontend)

1. Vercel → **frontend project** → **Settings → Environment Variables**.
2. Remove old `VITE_BACKEND_URL` (localhost / tunnel / wrong API).
3. Add for **Production** (and Preview if you use it):

| Key | Value |
|:---|:---|
| `VITE_BACKEND_URL` | `https://YOUR-SERVICE.onrender.com` *(from §1.2, no slash)* |
| `VITE_RAZORPAY_KEY_ID` | same **key id** as backend `RAZORPAY_KEY_ID` (the `rzp_live_…` public id) |

4. **Do not** put `RAZORPAY_KEY_SECRET` on Vercel. Secret stays on Render only.
5. After any `VITE_` change: **Deployments → ⋯ → Redeploy** (or push an empty commit). Vite bakes env in at **build** time.

### 2.3 Frontend domain

1. Vercel → frontend → **Settings → Domains**.
2. Add `afiyaleather.com` and `www.afiyaleather.com`.
3. Copy the DNS records Vercel shows. You will paste them on Hostinger in **§4**.

---

## 3. Vercel — admin

### 3.1 Project settings

| Setting | Value |
|:---|:---|
| Root directory | `admin` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### 3.2 Wipe and re-import env (Vercel admin)

1. Remove old `VITE_BACKEND_URL`.
2. Add:

| Key | Value |
|:---|:---|
| `VITE_BACKEND_URL` | **same** Render URL as frontend |

3. Redeploy.

### 3.3 Admin domain (recommended)

1. Add `admin.afiyaleather.com` on the admin Vercel project.
2. Hostinger: **CNAME** `admin` → `cname.vercel-dns.com` (or the host Vercel prints).
3. Then set Render `ADMIN_URL=https://admin.afiyaleather.com` and include it in `CORS_ORIGINS`. Redeploy Render.

Until that subdomain exists, use the `*.vercel.app` admin URL in Render `ADMIN_URL` + `CORS_ORIGINS`.

---

## 4. Hostinger — point domain at Vercel

Hostinger does **not** host the React app. It only holds DNS.

1. Hostinger → **Domains → afiyaleather.com → DNS**.
2. **Keep** Resend records: `resend._domainkey` TXT, `send` TXT, `send` MX.
3. **Change** the site records to what **Vercel frontend** showed:

| Type | Name | Content | Notes |
|:---|:---|:---|:---|
| A | `@` | IP from Vercel (often `76.76.21.21`) | Replace old `2.57.91.91` |
| CNAME | `www` | `cname.vercel-dns.com` | Replace old www → `afiyaleather.com` if needed |
| CNAME | `admin` | `cname.vercel-dns.com` | Only if you added admin subdomain |

4. Wait until Vercel domain status is **Valid** (5–60 min).
5. Open `https://afiyaleather.com`.

Do **not** upload `dist` to Hostinger File Manager.

---

## 5. After DNS is green — fix URLs once

| Where | Key | Value |
|:---|:---|:---|
| Render | `FRONTEND_URL` | `https://afiyaleather.com` |
| Render | `ADMIN_URL` | `https://admin.afiyaleather.com` or live admin URL |
| Render | `CORS_ORIGINS` | shop + www + admin, comma-separated, no spaces required |
| Vercel frontend | `VITE_BACKEND_URL` | Render API URL |
| Vercel admin | `VITE_BACKEND_URL` | same Render API URL |

Redeploy **Render**, then **both Vercel** projects.

---

## 6. Go-live test (do this before handing to the client)

| # | Test | Pass |
|:---|:---|:---|
| 1 | `https://afiyaleather.com` loads shop | Theme, products |
| 2 | `https://admin.…` login | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env |
| 3 | Register new customer | OTP from `orders@afiyaleather.com` |
| 4 | Add to cart → COD order | Order in admin |
| 5 | Razorpay test/live pay | Payment success email |
| 6 | Forgot password | Link uses `https://afiyaleather.com` |
| 7 | Footer | Phone, WhatsApp, Instagram, Facebook |
| 8 | Shiprocket (if enabled) | Create shipment on a paid/COD order |

If OTP fails: Render logs → mail errors; confirm `MAIL_PROVIDER=resend` and `EMAIL_FROM=Afiya Leathers <orders@afiyaleather.com>`.

---

## 7. Order of work (short)

```text
1. Push code to GitHub
2. Render: wipe/import env → deploy → copy API URL
3. Vercel frontend: set VITE_* → redeploy → add afiyaleather.com
4. Vercel admin: set VITE_BACKEND_URL → redeploy → add admin subdomain
5. Hostinger DNS: A + CNAME to Vercel (keep Resend records)
6. Render: FRONTEND_URL + ADMIN_URL + CORS → redeploy
7. Run the go-live test list
```

---

## 8. What you copy from local files

| Dashboard | Source file |
|:---|:---|
| Render | `backend/.env` (all secrets) + production URLs from this doc |
| Vercel frontend | `VITE_RAZORPAY_KEY_ID` from `frontend/.env`; API URL from Render |
| Vercel admin | only Render API URL |

Local `backend/.env.production` is a mail/URL starter (gitignored). Do not rely on it for Mongo/Razorpay/Shiprocket — those are in `backend/.env`.

---

## 9. Common mistakes

- Leaving `VITE_BACKEND_URL=http://localhost:5000` on Vercel → shop cannot talk to API.
- Forgetting to **redeploy** after changing `VITE_` vars.
- `FRONTEND_URL` still `http://localhost:5173` on Render → reset links and CORS break.
- Deleting Resend DNS while changing the A record → OTP dies.
- Putting Razorpay **secret** on Vercel.
- Using `afiyaleathers.com` (with an **s**) anywhere — the real domain is **afiyaleather.com**.

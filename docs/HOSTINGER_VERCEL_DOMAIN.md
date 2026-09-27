# Connect Hostinger domain to Vercel

Your live domain is **afiyaleather.com** (Hostinger). The storefront and admin should stay on **Vercel**. The API stays on **Render**. You do not move the React files onto Hostinger hosting.

## 1. Add the domain in Vercel

1. Open the **frontend** project on Vercel → **Settings → Domains**.
2. Add `afiyaleather.com` and `www.afiyaleather.com`.
3. Vercel will show the DNS records it needs (usually an **A** record for `@` and a **CNAME** for `www`).

Do the same for the **admin** project if it has its own URL, e.g. `admin.afiyaleather.com` (CNAME to `cname.vercel-dns.com`).

## 2. Point DNS on Hostinger

Hostinger → **Domains → DNS / Nameservers** for `afiyaleather.com`.

Typical Vercel setup (use the **exact** values Vercel shows):

| Type | Name | Content |
|:---|:---|:---|
| A | `@` | `76.76.21.21` *(confirm in Vercel)* |
| CNAME | `www` | `cname.vercel-dns.com` |

You already have an A record `@ → 2.57.91.91` (Hostinger parking/site). **Replace** that A record with Vercel’s IP, or the domain will not open your shop.

Keep the **Resend** records (`resend._domainkey`, `send` TXT, `send` MX). Do not delete those.

## 3. SSL

Vercel issues HTTPS automatically after DNS verifies (often 5–30 minutes). Open `https://afiyaleather.com` when status is **Valid**.

## 4. Env after the domain is live

**Frontend (Vercel):**

```env
VITE_BACKEND_URL=https://YOUR-RENDER-API.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

Redeploy frontend after changing `VITE_` vars.

**Backend (Render):**

```env
FRONTEND_URL=https://afiyaleather.com
ADMIN_URL=https://admin.afiyaleather.com
MAIL_PROVIDER=resend
EMAIL_FROM=Afiya Leathers <orders@afiyaleather.com>
```

Password-reset links use `FRONTEND_URL`. CORS uses both URLs.

## 5. Do not

- Do not upload the Vite `dist` folder to Hostinger file manager as the main site (you would lose Vercel deploys).
- Do not change nameservers unless Vercel asks you to use Vercel nameservers (A + CNAME on Hostinger DNS is enough).

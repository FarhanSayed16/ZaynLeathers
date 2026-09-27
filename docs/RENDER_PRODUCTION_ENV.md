# Production env — Render (Afiya Leathers)

Live domain: **https://afiyaleather.com**  
Mail from: **orders@afiyaleather.com** (Resend verified)

Local `backend/.env` is already set for Resend. Render does **not** read that file — copy the same mail vars there.

## Render → Environment (required)

| Key | Value |
|:---|:---|
| `MAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | same key as local `backend/.env` (name **AfiyaLeathers**) |
| `EMAIL_FROM` | `Afiya Leathers <orders@afiyaleather.com>` |
| `EMAIL_REPLY_TO` | `afiyaleather8@gmail.com` |
| `ALLOW_DEV_OTP` | `false` |
| `FRONTEND_URL` | `https://afiyaleather.com` |
| `ADMIN_URL` | your live admin URL (Vercel), no trailing slash |
| `NODE_ENV` | `production` |

Optional: `CORS_ORIGINS=https://afiyaleather.com,https://www.afiyaleather.com,https://YOUR-ADMIN.vercel.app`

A gitignored copy of the mail block is in `backend/.env.production` for paste-only.

## After saving on Render

1. Manual deploy / restart the backend.  
2. Register a new account with a real Gmail.  
3. OTP should arrive from **Afiya Leathers** `<orders@afiyaleather.com>`.

## Frontend / Admin (Vercel)

Set `VITE_BACKEND_URL` to the public Render API URL (no trailing slash), then redeploy both apps.

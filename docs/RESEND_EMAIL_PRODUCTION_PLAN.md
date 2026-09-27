# Resend email + production mail plan

**Project:** Afiya Leathers (Render backend + storefront/admin)  
**Owner:** Farhan Sayed  
**Updated:** 16 August 2026  

**Status:** Code + verified domain **`afiyaleather.com`**. Local mail env is production-ready. **Render dashboard env still must be pasted** (this repo cannot log into Render).

| Phase | Status |
|:---|:---|
| A — `mailer.js` Resend + SMTP | **Done** |
| B — env example + docs | **Done** |
| C — Resend domain | **Done** — `afiyaleather.com` Verified |
| D — QA on Render | Paste env (see `docs/RENDER_PRODUCTION_ENV.md`) then test OTP |
| E — OTP HTML + retry + reply-to | **Done** |

Use `EMAIL_FROM=Afiya Leathers <orders@afiyaleather.com>` — not `afiyaleathers.com`.

Controllers still call `sendEmail({ to, subject, html })`. Set these on Render:

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="Afiya Leathers <orders@afiyaleathers.com>"
ALLOW_DEV_OTP=false
FRONTEND_URL=https://afiyaleathers.com
ADMIN_URL=https://admin.afiyaleathers.com
```

Until `RESEND_API_KEY` is set, local/dev keeps using existing Gmail SMTP.

---

---

## 1. Problem

All outbound mail today uses **nodemailer + SMTP** (typically Gmail) in:

```text
backend/utils/mailer.js  →  sendEmail({ to, subject, html })
```

### What depends on it

| Flow | Location |
|:---|:---|
| Register OTP | `backend/controllers/userController.js` |
| Resend OTP | same |
| Forgot password | same |
| Order / status / partial-pay emails | `orderController.js`, `adminOrderController.js` |
| Shipping-related emails | `shippingController.js` |
| Contact form → admin | `contactController.js` |

### Why Gmail SMTP fails on Render

1. Cloud hosts often block or throttle outbound SMTP (`465` / `587`).
2. Gmail app passwords break when account security or workspace rules change.
3. Even when “sent”, messages may land in spam or be rejected (shared IP + `gmail.com` From).
4. With `ALLOW_DEV_OTP=false` (correct for production), a mail failure means the user sees an error and **never gets a code**.

**Conclusion:** Production auth mail needs a transactional provider. **Resend.com** is the recommended default.

---

## 2. Recommended approach

### Architecture (minimal change)

Keep every controller calling `sendEmail({ to, subject, html })`. Only the mailer chooses the backend:

```text
Controllers (OTP, orders, contact, …)
        │
        ▼
  sendEmail({ to, subject, html })     ← stable public API
        │
        ▼
  mailer.js
        ├── MAIL_PROVIDER=resend  → Resend HTTP API  (production)
        └── MAIL_PROVIDER=smtp    → nodemailer        (optional local)
```

**Prefer Resend HTTP API** (not only SMTP through Resend):

- Avoids SMTP port issues on Render  
- Clear API errors in logs  
- Official `resend` npm package  

SMTP path can stay for local development only.

### From address (critical)

```env
EMAIL_FROM="Afiya Leathers <orders@afiyaleathers.com>"
```

| Stage | From address | Who can receive |
|:---|:---|:---|
| Resend free test | `… <onboarding@resend.dev>` | Only your verified Resend test inbox |
| Production OTP to any customer | Address on a **verified domain** | All customers |

Without **domain verification** (SPF/DKIM on `afiyaleathers.com` or a subdomain), OTP to random Gmail users will not be reliable.

---

## 3. Implementation phases

### Phase A — Code (mailer abstraction)

| Step | Work |
|:---|:---|
| A1 | Add dependency: `resend` |
| A2 | Rewrite `backend/utils/mailer.js`: |
| | • Read `MAIL_PROVIDER` = `resend` \| `smtp` |
| | • Resend path: API key + `emails.send({ from, to, subject, html })` |
| | • SMTP path: keep existing nodemailer behaviour |
| | • `from` display name from `brand.email.fromName`; address from `EMAIL_FROM` |
| A3 | Log provider + message id / error body (**do not log OTP body** in production) |
| A4 | Fail loudly if required env is missing (no silent fake success) |

**Controllers:** no functional rewrite required if `sendEmail` signature stays the same.

### Phase B — Environment & docs

| Step | Work |
|:---|:---|
| B1 | Update `backend/.env.example` |
| B2 | Update `ENV_WHAT_YOU_NEED.md` (or equivalent) and client handover notes |
| B3 | Set variables on **Render** (production), not only local `.env` |

#### Proposed env vars

```env
# Mail — production on Render
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="Afiya Leathers <orders@afiyaleathers.com>"

# Optional local fallback only
# MAIL_PROVIDER=smtp
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=...
# SMTP_PASS=...

# Never true on Render
ALLOW_DEV_OTP=false
```

### Phase C — Resend account & DNS (ops)

| Step | Work | Owner |
|:---|:---|:---|
| C1 | Create Resend account (agency or client) | Farhan / Mohd Alishan |
| C2 | Add domain `afiyaleathers.com` or `mail.afiyaleathers.com` | Client DNS access |
| C3 | Add SPF / DKIM (and optional DMARC) records Resend shows | DNS admin |
| C4 | Verify domain in Resend dashboard | Farhan |
| C5 | Set `EMAIL_FROM` to verified sender | Farhan |
| C6 | Add `RESEND_API_KEY` + `MAIL_PROVIDER=resend` on Render → redeploy | Farhan |

### Phase D — QA checklist

| Test | Pass criteria |
|:---|:---|
| New user register | OTP in inbox (check spam once) within ~30 seconds |
| Resend OTP | New code works; pending registration not stuck |
| Forgot password | Reset email arrives |
| Place order (test) | Order-related emails still fire if enabled |
| Contact form | Admin receives at `ADMIN_EMAIL` |
| Render logs | Message id / success log; no socket timeout to Gmail |

### Phase E — Optional polish (same or later PR)

| Item | Why |
|:---|:---|
| Better OTP HTML + plain-text part | Clarity + deliverability |
| One automatic retry on Resend 429 / 5xx | Transient failures |
| Brand subject lines already in `shared/brand.config` | Keep using them |
| Client handover: “Mail = Resend + domain DNS” | Clear ownership |

---

## 4. Effort estimate

| Work | Approx. effort |
|:---|:---|
| Code + package + `.env.example` | 1–2 hours |
| Resend signup + domain DNS | 30–60 minutes + DNS propagation |
| Deploy + OTP / forgot QA | ~1 hour |

---

## 5. Related production checks (same go-live window)

Fixing mail alone is not enough if other env is wrong.

| Area | Risk | Action |
|:---|:---|:---|
| `FRONTEND_URL` / `ADMIN_URL` | Reset / CORS still point at localhost | Set real production URLs on Render |
| `VITE_BACKEND_URL` | Storefront/admin call wrong API | Set public Render API on Vercel (or host) |
| `ALLOW_DEV_OTP` | Fake OTP or mixed behaviour | Must be `false` on production |
| Razorpay | Live keys / domain whitelist | Confirm live mode after mail works |
| Admin password | Default still in env | Client changes after handover |
| Shiprocket | Separate from OTP | Verify only if shipping live |
| Rate limits | Register/resend already limited | Keep as-is |

---

## 6. Explicit decisions

1. **Yes — use Resend** for production mail (`MAIL_PROVIDER=resend`).  
2. **Verify a real domain** before promising OTP to all customers.  
3. **Do not** use Gmail SMTP as the production path on Render.  
4. **Do not** rely on `ALLOW_DEV_OTP` as a production workaround.  
5. Controllers stay on `sendEmail`; **only `mailer.js` (plus env/docs) changes** for the core fix.

---

## 7. Suggested build order (when implementing)

1. Implement Phase A + B (code + examples).  
2. Obtain `RESEND_API_KEY` and verify domain.  
3. Set Render env → redeploy backend.  
4. Run Phase D (OTP + forgot password + one order email smoke test).  
5. Update handover docs if not already covered.  

---

## 8. Files involved

| File | Role |
|:---|:---|
| `backend/utils/mailer.js` | **Primary code change** |
| `backend/package.json` | Add `resend` |
| `backend/.env.example` | Document `MAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` |
| Render dashboard env | Production secrets |
| Controllers (OTP, orders, …) | Unchanged API calls |
| Domain DNS for Afiya Leathers | Deliverability |

---

## 9. Notes for Afiya Leathers client

- **Mohd Alishan / Afiya Leathers** should own or control DNS for `afiyaleathers.com` so SPF/DKIM can be added.  
- Business mailbox for display can stay `afiyaleather8@gmail.com` for replies; **sending** should be a Resend-verified address on the brand domain (e.g. `orders@afiyaleathers.com` or `noreply@…`).  
- Production admin notification recipient remains `ADMIN_EMAIL` (currently project env: `afiyaleather8@gmail.com`).

---

*Not legal advice. For implementation, treat this as the technical checklist before launch.*

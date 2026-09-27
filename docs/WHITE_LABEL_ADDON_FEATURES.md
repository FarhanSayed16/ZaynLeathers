# White-label addon features — packaging & pricing guide

**Purpose:** Ideas for **sellable modules** on top of the base Zayn Leathers shop (catalog, cart, checkout, admin, CMS). Flip each module via `.env` (`FEATURE_*`) so you can charge different clients different amounts without forking the codebase.

**Last updated:** 20 August 2026

---

## How to use this doc

| Column | Meaning |
|--------|---------|
| **Status** | `Shipped` = already in repo (toggle only) · `Partial` = foundation exists · `New` = needs build |
| **Effort** | Rough build time for one dev (S / M / L) |
| **Client value** | Why a leather/D2C brand pays extra |
| **Suggested tier** | Starter / Growth / Pro / Enterprise |

---

## Recommended packaging (simple)

| Tier | Includes | Typical buyer |
|------|----------|----------------|
| **Starter** | Base shop + COD + basic admin | New brand, &lt;50 SKUs |
| **Growth** | Starter + 2–3 Growth addons | Serious D2C, daily orders |
| **Pro** | Growth + analytics, automation, roles | ₹50L+ GMV, small team |
| **Enterprise** | Pro + B2B, custom integrations | Wholesale + retail, multi-store |

---

## 10 sellable addon ideas

### 1. Smart product recommendations

| | |
|---|---|
| **Status** | **Shipped** — `FEATURE_RECOMMENDATIONS` |
| **What it is** | PDP “Similar products”, cart “Complete the look”, home “Picked for you”. Admin pins related products; engine auto-fills with category, price band, and “frequently bought together” from orders. |
| **Client value** | Higher AOV and conversion without hiring a merchandiser. Easy upsell story: “Amazon-style suggestions on your site.” |
| **Effort** | **S** (done) — gate UI + API, document in proposal |
| **Suggested tier** | **Growth** (popular upsell) |
| **Env** | `FEATURE_RECOMMENDATIONS=true` |

---

### 2. Abandoned cart recovery (email + WhatsApp nudges)

| | |
|---|---|
| **Status** | **New** |
| **What it is** | Save cart for logged-in users; optional guest email capture. Automated reminders at 1h / 24h / 72h with cart link and optional small coupon. Admin sees abandoned carts list and recovery rate. |
| **Client value** | Direct revenue recovery — industry benchmark 5–15% of abandoned carts convert. Strong ROI slide for sales calls. |
| **Effort** | **M** — cron/worker, email (Resend already planned), optional WhatsApp deep link |
| **Suggested tier** | **Growth** (high perceived value) |
| **Env** | `FEATURE_ABANDONED_CART=true` |

---

### 3. WhatsApp Commerce Pro (beyond click-to-chat)

| | |
|---|---|
| **Status** | **Lite shipped & env-wired** — `FEATURE_WHATSAPP`; Business API not built |
| **What it is** | **Lite (Shipped):** `wa.me` links from admin (order status, customer hello). **Pro (New):** WhatsApp Business API — order confirmed, shipped, out-for-delivery, delivered; back-in-stock alerts; optional catalog share. |
| **Client value** | Indian buyers live on WhatsApp; Pro feels “premium support” and reduces “where is my order?” calls. |
| **Effort** | Lite **S** · Pro **L** (Meta BSP, templates, webhooks) |
| **Suggested tier** | Lite = **Starter** · Pro = **Pro** |
| **Env** | `FEATURE_WHATSAPP=true` (lite) · `FEATURE_WHATSAPP_API=true` (pro) |

---

### 4. Loyalty points & referral program

| | |
|---|---|
| **Status** | **New** |
| **What it is** | Earn points on purchase; redeem at checkout. Refer-a-friend link gives both sides a coupon or points. Admin sets earn rate, expiry, min redeem. Customer “Rewards” page in account. |
| **Client value** | Repeat purchases for leather (long lifecycle product). Referrals = cheap acquisition. |
| **Effort** | **M** — user ledger, checkout integration, admin rules |
| **Suggested tier** | **Pro** |
| **Env** | `FEATURE_LOYALTY=true` |

---

### 5. Advanced analytics & export suite

| | |
|---|---|
| **Status** | `Shipped` — `FEATURE_ANALYTICS_PRO` |
| **What it is** | Product performance (views → cart → purchase), category GMV, coupon ROI, return/RTO rate, CSV export schedules, comparison vs last period. Optional daily email digest to owner. |
| **Client value** | Owner stops asking you for “which jacket sells best?” Self-serve data = stickier retainer. |
| **Effort** | **M** — aggregate queries, new admin pages |
| **Suggested tier** | **Pro** |
| **Env** | `FEATURE_ANALYTICS_PRO=true` |

---

### 6. Back-in-stock & waitlist alerts

| | |
|---|---|
| **Status** | **New** |
| **What it is** | On PDP, when size/color is OOS: “Notify me”. Queue email/WhatsApp when admin restocks that variant. Admin sees demand per SKU/size. |
| **Client value** | Captures intent instead of losing the sale; helps buying/stock decisions. Perfect for made-to-order leather sizes. |
| **Effort** | **M** |
| **Suggested tier** | **Growth** |
| **Env** | `FEATURE_BACK_IN_STOCK=true` |

---

### 7. Catalog variants pro (style / colour / size matrix)

| | |
|---|---|
| **Status** | **Shipped** — `FEATURE_CATALOG_VARIANTS`, size matrix, style grouping, catalog cleanup audit |
| **What it is** | One “style” with multiple colours and per-size stock; shop dedupes cards; admin variant editor and cleanup tools. |
| **Client value** | Required for apparel/leather with sizes — without it the shop looks like a toy. Sell as **mandatory upgrade** for fashion clients. |
| **Effort** | **S** (done) |
| **Suggested tier** | **Growth** (often bundled, not optional for fashion) |
| **Env** | `FEATURE_CATALOG_VARIANTS=true` |

---

### 8. Multi-staff admin, roles & activity log

| | |
|---|---|
| **Status** | **New** (single admin login today) |
| **What it is** | Roles: Owner, Catalog manager, Order packer, Support (read-only). Audit log: who changed price, status, coupon. Optional 2FA for owner. |
| **Client value** | Teams won’t share one password; enterprise trust and compliance. |
| **Effort** | **L** |
| **Suggested tier** | **Enterprise** |
| **Env** | `FEATURE_ADMIN_ROLES=true` |

---

### 9. B2B / partner wholesale portal

| | |
|---|---|
| **Status** | **Partial** — `FEATURE_PARTNER_ORDERS` flag exists; full portal TBD |
| **What it is** | Separate login for retailers: tier pricing, MOQ, credit terms, bulk CSV order upload, approval workflow. Retail catalog may hide MRP or show “your price”. |
| **Client value** | Many leather brands sell retail + wholesale; second revenue stream on same platform. |
| **Effort** | **L** |
| **Suggested tier** | **Enterprise** |
| **Env** | `FEATURE_PARTNER_ORDERS=true` |

---

### 10. GST invoices, credit notes & accounting export

| | |
|---|---|
| **Status** | **Shipped** — `FEATURE_INVOICING` (optional GST; bill mode without GSTIN) |
| **What it is** | PDF invoice/bill, optional GSTIN + HSN, credit notes, accounting CSV, WhatsApp share of PDF link. Auto-email on deliver: **not yet** (manual generate). |
| **Env** | `FEATURE_INVOICING=true` |

---

## Bonus ideas (11–12) — future pipeline

| # | Feature | Status | Why sell it |
|---|---------|--------|-------------|
| 11 | **Coupons & campaigns pro** | Shipped (`FEATURE_COUPONS`) | Min order, usage caps, flash sales strip — bundle as “Marketing kit” with Instagram promos (`FEATURE_INSTAGRAM`) |
| 12 | **Reviews & UGC pro** | Shipped (`FEATURE_REVIEWS`) | Moderation, photo reviews, import to home — social proof package |

---

## Already in repo — bundle as “modules” (don’t give away free)

These are implemented and can be **disabled per client** today:

| Module | Env flag | Bundle suggestion |
|--------|----------|-------------------|
| Wishlist | `FEATURE_WISHLIST` | Starter+ engagement pack |
| Product reviews | `FEATURE_REVIEWS` | Trust & conversion pack |
| Coupons | `FEATURE_COUPONS` | Marketing pack |
| Instagram promos | `FEATURE_INSTAGRAM` | Marketing pack |
| Multi-currency display | `FEATURE_MULTI_CURRENCY` | Export / NRI tier |
| Razorpay online pay | `RAZORPAY_*` keys | Payment pack |
| Shiprocket shipping | `SHIPPING_ENABLED` | Fulfillment pack |
| Partial payment / COD advance | `PARTIAL_PAYMENT_ENABLED` | High-value COD pack |

---

## Top 5 picks — best to sell first

Ranked by **ease of sale**, **build vs reward**, and **fit for leather D2C in India**.

| Rank | Addon | Why this one |
|------|-------|--------------|
| **1** | **Smart recommendations** | Already built; instant upsell; clients understand “like Amazon” |
| **2** | **Catalog variants pro** | Fashion clients *need* it; justify higher base price or mandatory Growth tier |
| **3** | **Abandoned cart recovery** | Clear ROI number in proposals; recurring “automation” narrative |
| **4** | **WhatsApp Commerce Pro** | India-specific; upgrade path from free click-to-chat to paid API tier |
| **5** | **GST invoicing & exports** | Compliance sells itself to any registered Indian brand |

**Build next (if you want 2 new modules):** abandoned cart + back-in-stock — both Medium effort, strong demo, no enterprise complexity.

**Save for big deals:** B2B portal + admin roles — Large effort, but justifies **Enterprise** pricing (₹2–5L+ project uplift).

---

## Example client-facing bundles

### “Growth D2C” — ₹X/month or one-time setup uplift

- Catalog variants pro  
- Smart recommendations  
- Coupons + Instagram promos  
- Back-in-stock alerts *(when built)*  
- WhatsApp Lite (click-to-chat)

### “Pro Operator” — higher retainer

- Everything in Growth  
- Abandoned cart recovery  
- Analytics pro  
- GST invoicing  
- WhatsApp API *(when built)*

### “Enterprise wholesale”

- Everything in Pro  
- B2B partner portal  
- Multi-staff roles & audit log  
- Custom SLA / priority support  

---

## Implementation checklist (for you)

When a client buys an addon:

1. Set flags in `backend/.env` on their deployment  
2. Confirm `GET /api/settings` exposes `settings.features.*` to storefront/admin  
3. Add line item to **CLIENT_SWAP_CHECKLIST.md** and proposal SOW  
4. Smoke-test: feature on → UI visible; feature off → no broken empty states  

Central flag file: `backend/config/features.js`

---

## Decision prompts (for your review)

Before building, ask per feature:

1. Can we **demo it in 30 seconds** on a sales call?  
2. Is it **off by default** without breaking the base shop?  
3. Does the client **measure ROI** (recovery %, AOV lift, time saved)?  
4. Is it **India-relevant** (GST, WhatsApp, COD, Shiprocket)?  

If yes to 3+ → good addon candidate.

---

*When you pick 2–4 from this list, we can add flags, admin toggles, and implementation tickets in the main roadmap.*

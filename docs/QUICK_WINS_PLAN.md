# Quick wins — implementation plan

**Purpose:** Five high-value, low-risk enhancements for Zayn Leathers admin + customer experience.  
**Last updated:** 22 August 2026  
**Status:** Planned — ready for execution  
**Prerequisite modules:** `FEATURE_INVOICING` (bulk + PDF tweak), `FEATURE_ANALYTICS_PRO` (digest only)

---

## Summary

| # | Enhancement | Effort | Phase |
|---|-------------|--------|-------|
| 1 | Order confirmation email (order link + invoice note) | **S** | 1 |
| 2 | PDF partial-payment label fix | **S** | 1 |
| 3 | **Bulk invoice generation with date filters** | **M** | 2 |
| 4 | Analytics daily email digest | **M** | 3 |
| 5 | Low-stock alerts on admin dashboard | **S–M** | 3 |

**Recommended build order:** 1 → 2 → 3 → 5 → 4  
(Bulk invoicing is the largest piece; email + PDF are fast wins first.)

---

## Phase 1 — Email + PDF (same day)

### 1.1 Order confirmation email

**Problem:** Customer emails say “order placed” but no link to account; no mention of invoice timing.

**Scope**

- Update **all** customer-facing “order placed” emails:
  - COD (`placeOrder`)
  - Razorpay verify (`verifyRazorpay`)
  - Partial advance (`verifyPartial`)
- Add to HTML body:
  - **View order:** `{FRONTEND_URL}/orders/{orderId}`
  - **Invoice line** (only if `FEATURE_INVOICING` + invoice settings enabled):
    - *“Your tax invoice / receipt will be available in My Account after delivery (we’ll email you when it’s ready).”*
- Reuse `brand.email.orderConfirmedSubject`; optional new key `orderConfirmedHtml` helper in `backend/utils/orderEmail.js` to avoid copy-paste across 3 handlers.

**Out of scope:** Attaching PDF at placement (invoice does not exist yet).

**Acceptance**

- [ ] Every new order email contains a working order detail link
- [ ] Invoicing OFF → no invoice paragraph
- [ ] Invoicing ON → invoice paragraph present
- [ ] Link uses `FRONTEND_URL` from env (no trailing slash)

---

### 1.2 PDF payment block — partial balance label

**Problem:** After balance collected, PDF still shows “Balance due: ₹X” plus “Collected on delivery”.

**File:** `backend/utils/invoicing/gstBreakdown.js` → `buildPaymentBlock`

**Logic**

```
if partial:
  show Advance paid
  if balancePaid:
    show "Balance paid: Rs.X" (or "Balance collected on delivery")
  else if balanceAmount > 0:
    show "Balance due: Rs.X"
```

**Acceptance**

- [ ] Partial + balance unpaid → Advance + Balance due
- [ ] Partial + balance paid → Advance + Balance paid (no “due”)
- [ ] Full Razorpay/COD unchanged

---

## Phase 2 — Bulk invoice generation (main feature)

### 2.1 Goals

- One admin workflow to **catch up historical delivered orders** (before auto-invoice existed).
- **Date filtering** so owner can match **week / month / custom period** for accounting.
- **Preview before run** — see count, total value, which orders qualify.
- **Safe defaults** — skip orders that already have an invoice; optional “regenerate” stays **single-order only** (not bulk) to avoid duplicate invoice numbers.

---

### 2.2 Date filter model (admin chooses)

Three **date axes** (dropdown):

| Axis | Field used | Best for |
|------|------------|----------|
| **Order date** | `order.date` or `createdAt` | Sales booked in period |
| **Delivery date** | `items[].status` → first/last `Delivered` transition* | Revenue when delivered |
| **Invoice issued** | `invoice.issuedAt` | Already invoiced in period (for re-export / audit) |

\* *Delivery date:* store `deliveredAt` on order when all active items become Delivered (small schema addition in Phase 2). Until then, **proxy:** order has all active items `Delivered` AND `updatedAt` in range (document limitation in v1).

**Presets** (reuse pattern from `admin/src/pages/Analytics.jsx` + `backend/utils/analytics/dateRange.js`):

| Preset | Range |
|--------|--------|
| Today | Start/end of today (IST) |
| This week | Mon–Sun current week (IST) |
| Last 7 days | Rolling |
| This month | 1st → last day of current month |
| Last month | Previous calendar month |
| Custom | `from` + `to` date pickers |

**Timezone:** Asia/Kolkata (`en-IN`) for preset boundaries — same as analytics.

---

### 2.3 Eligibility filters (checkboxes / toggles)

| Filter | Default | Rule |
|--------|---------|------|
| **Fully delivered** | ON | All non-cancelled items `status === Delivered` |
| **Missing invoice only** | ON | `!order.invoice.number` |
| **Has billable items** | ON (implicit) | At least one non-cancelled line |
| **Payment method** | All | Optional multi-select: COD, Razorpay, Partial |
| **Min order amount** | — | Optional |

**Exclude:** Guest-only / cancelled-only orders.

---

### 2.4 API design

**Preview (read-only)**

```
GET /api/invoice/bulk/preview?from=2026-08-01&to=2026-08-31&dateField=order|delivered|issued&deliveredOnly=true&missingInvoiceOnly=true
```

Response:

```json
{
  "success": true,
  "range": { "from": "2026-08-01", "to": "2026-08-31", "preset": "this_month", "dateField": "order" },
  "summary": {
    "eligible": 42,
    "skippedAlreadyInvoiced": 8,
    "skippedNotDelivered": 5,
    "totalAmount": 384500
  },
  "orders": [
    { "orderId": "...", "shortId": "e89ea632", "date": "...", "amount": 8999, "paymentMethod": "COD", "customer": "Viraj D.", "hasInvoice": false }
  ]
}
```

Cap preview list at **200 rows**; summary counts always full.

**Execute**

```
POST /api/invoice/bulk/issue
Body: { same filters as preview, "sendEmail": true, "limit": 100 }
```

Response:

```json
{
  "success": true,
  "processed": 42,
  "issued": 40,
  "skipped": 2,
  "failed": 0,
  "failures": [{ "orderId": "...", "message": "Cloudinary upload failed" }],
  "issuedInvoiceNumbers": ["INV-2526-001", "..."]
}
```

- Process **sequentially** or small batches (5 at a time) to avoid Cloudinary rate limits.
- Max **100 invoices per request** (configurable); admin runs again for next batch if needed.
- Reuse `issueInvoiceForOrder` + `emailInvoiceToCustomer` from `backend/utils/invoicing/issueInvoiceForOrder.js`.
- **`requireFeature("invoicing")` + `adminAuth`**

**Export alignment**

After bulk issue, admin can download existing:

```
GET /api/invoice/export/accounting?from=&to=
```

Ensure accounting CSV **`issuedAt`** filter matches the same `from`/`to` so **week/month totals in admin match CSV**.

---

### 2.5 Admin UI

**Location (pick one — recommend A):**

- **A)** New page: **Admin → Invoices → Bulk generate** (sidebar under System or Sales when invoicing ON)
- **B)** Tab on **Settings → Invoices & tax**

**UI blocks**

1. **Date range** — preset pills + custom from/to  
2. **Date axis** — Order date | Delivered (all items) | Invoice issued  
3. **Filters** — missing invoice only, delivered only, payment method  
4. **Preview table** — sortable, select/deselect rows (optional v1: all eligible)  
5. **Summary card** — eligible count, ₹ total, already invoiced count  
6. **Actions** — “Preview” → “Generate N invoices” (confirm modal)  
7. **Checkbox** — “Email customers after each invoice” (default ON, respects `emailCustomerOnInvoice` setting)  
8. **Result panel** — success/fail list + link to **Download accounting CSV** for same range  

**Reuse:** `admin/src/utils/analyticsUi.js` date presets; styling from `Analytics.jsx`.

---

### 2.6 Schema tweak (recommended)

Add to `orderModel`:

```js
deliveredAt: { type: Date, default: null, index: true }
```

Set when `orderIsFullyDelivered(order)` becomes true (in `updateStatus`, shipping webhook, same place as `maybeAutoInvoiceAfterDelivery`).

Bulk filter **Delivery date** uses `deliveredAt` — accurate for “invoices for orders delivered in August.”

**Backfill script (optional one-time):** `node backend/scripts/backfillDeliveredAt.js` for old delivered orders.

---

### 2.7 Edge cases

| Case | Behavior |
|------|----------|
| Order delivered but seller GSTIN added later | Bulk generates with **current** seller config (snapshot stored on invoice) |
| Partial payment, balance not collected | Still eligible if delivered; PDF shows advance/balance correctly |
| Multi-item, one cancelled | Eligible if remaining items all Delivered |
| Cloudinary down | That order in `failures[]`; others continue |
| 500+ eligible orders | Preview shows count; execute in batches of 100 |

---

### 2.8 Acceptance — bulk invoicing

- [ ] Presets: today, this week, this month, last month, custom range work in IST
- [ ] Preview count matches execute count for same filters
- [ ] Orders with existing invoice skipped when “missing only” ON
- [ ] Non-delivered orders excluded when “delivered only” ON
- [ ] Accounting CSV for same date range totals match preview ₹ sum (± rounding)
- [ ] Customer emails sent when checkbox ON
- [ ] Admin sees clear success/failure report

---

## Phase 3 — Dashboard ops + analytics digest

### 3.1 Low-stock alerts (dashboard)

**Goal:** Surface SKUs running out on **Overview** without opening every product.

**Rules**

- Product uses `sizeMatrix[]` with `qty` per size (primary).
- **Low** = any size with `0 < qty <= threshold` (default **3**).
- **Out** = all sizes qty `0` OR legacy `availableQuantity === 0`.

**API**

```
GET /api/product/low-stock?threshold=3&limit=20
```

Response: `{ critical: [...], low: [...], totalLowSkus: N }`  
Each row: product name, color, size, qty, link to edit.

**UI:** Card on `Dashboard.jsx` — “Low stock” / “Out of stock” with links to `/editProduct/:id`.  
Optional: env `LOW_STOCK_THRESHOLD=3` or setting in Admin Commerce later.

**Acceptance**

- [x] Matrix products show per-size lows
- [x] Legacy single-qty products still work
- [x] Empty catalog → empty state

---

### 3.2 Analytics daily email digest

**Goal:** Owner gets morning KPI email without opening Analytics Pro.

**Requires:** `FEATURE_ANALYTICS_PRO=true`, `ADMIN_EMAIL` or new `ANALYTICS_DIGEST_EMAIL`.

**Schedule:** Cron inside Node (e.g. `node-cron` at 8:00 AM IST) **or** external cron hitting:

```
POST /api/analytics/digest/run
Header: X-Cron-Secret: CRON_SECRET
```

**Content (yesterday vs prior day optional)**

- Orders count, revenue (paid + COD delivered proxy)
- Top 5 products by revenue
- Pending orders / balance due count (partial)
- Link to `{ADMIN_URL}/analytics`

**Settings (Admin → Settings or Analytics page)**

- Toggle: daily digest ON/OFF
- Email recipient (default `ADMIN_EMAIL`)

**Acceptance**

- [x] Digest OFF → no send
- [x] Digest ON → email arrives with correct yesterday numbers
- [x] Feature OFF → route returns 403/409

---

## Execution checklist (for dev)

### Phase 1 (~2–4 hours)

- [x] `backend/utils/orderEmail.js` — shared confirmation HTML
- [x] Wire COD / Razorpay / Partial customer emails
- [x] Fix `buildPaymentBlock` partial labels
- [ ] Manual test: place COD order → check email link

### Phase 2 (~1–2 days)

- [x] Add `deliveredAt` + set on full delivery
- [x] `GET /api/invoice/bulk/preview`
- [x] `POST /api/invoice/bulk/issue`
- [x] Admin page `BulkInvoices.jsx` + sidebar link
- [x] Backfill script `backend/scripts/backfillDeliveredAt.js`
- [ ] Run backfill once for historical delivered orders
- [ ] QA: month filter vs accounting CSV

### Phase 3 (~1 day)

- [x] `GET /api/product/low-stock` + dashboard card
- [x] Digest endpoint + cron + settings toggle
- [x] Update `PROJECT_COMPLETION_CHECKLIST.md`

---

## Env / flags (no new required flags)

| Variable | Used by |
|----------|---------|
| `FEATURE_INVOICING` | Bulk invoice, PDF tweak |
| `FEATURE_ANALYTICS_PRO` | Daily digest |
| `FRONTEND_URL` | Order email links |
| `ADMIN_URL` | Digest link to analytics |
| `CRON_SECRET` | (new, optional) Protect digest endpoint |
| `ANALYTICS_DIGEST_EMAIL` | (new, optional) Override admin email |

---

## What we are NOT building in this plan

- Bulk **regenerate** / force re-issue (duplicate invoice numbers risk)
- Bulk credit notes
- Guest order invoicing
- PDF attach on confirmation email
- Phase C account dashboard (explicitly skipped earlier)

---

## Next step

Start **Phase 1** (email + PDF), then **Phase 2 bulk invoicing** with preview + date filters as specified above. Confirm when ready to begin execution.

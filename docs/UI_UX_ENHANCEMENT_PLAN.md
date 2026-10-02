# Zayn Leathers — UI/UX Enhancement Plan (Client Reference)

**Status:** Phases A–F implemented · Phase G code-ready (live Woo blocked on Hostinger)  
**References:** `images/referenceimages/` (homepage, mega-menu, PLP, popup, custom jackets)  
**Context:** Frontend-only delivery; WooCommerce / Hostinger backend when client connects  
**Goal:** Match the *structure and shopping UX* of the Real Leather Garments–style references, while keeping **Zayn Leathers** brand identity (not cloning their logo/name).

---

## 1. What the client showed (reference digest)

### 1.1 Homepage shell (`1.png`–`4.png`)
| Pattern | Detail |
|---------|--------|
| Promo bar | Thin black strip: free shipping / offer copy |
| Header | Logo left · **search centered** · cart (+ count + total) right |
| Nav | All-caps links: Men ▾ · New Arrivals · Women ▾ · Kids · Movies Jackets · **Custom Leather Jackets** · Contact |
| Hero | Full-bleed lifestyle jacket image + elegant “NEW Arrival” typography |
| Product sections | Serif section titles + **horizontal carousels** with large `<` `>` arrows |
| Product cards | Clean cutout on white/light bg · centered name · centered price |
| Floating UI | Back-to-top (bottom-left) · sticky mini-cart/bag badge (bottom-right) |

### 1.2 Mega-menu (`5.png`)
Men hover opens a **4-column mega-menu**:
1. Jackets (many subtypes)  
2. Coats & more  
3. By color  
4. Accessories  

Clear column headings + hairline rules + lots of white space.

### 1.3 Collection / PLP (`6.png`–`7.png`)
| Pattern | Detail |
|---------|--------|
| Breadcrumbs | Home > New Arrivals |
| Left sidebar | Price range slider · Availability · nested Categories |
| Grid | 4 columns desktop · large product photos · name + price under image |
| Filters stay sticky while browsing |

### 1.4 Entry popup (`Popup_at_start/1.png`)
Split modal on first visit:
- **Left:** premium product / gift photo  
- **Right:** headline (“$100 Free Leather Gift…”) · gender radios · email · black CTA “UNLOCK YOUR GIFT”  
- Close (X) · dismissible · cookie/localStorage so it doesn’t spam every reload  

### 1.5 Custom Leather Jackets (`custom-option/1.png`)
Dedicated page + **nav CTA**:
- Breadcrumb · page title  
- Form: Name, Email, Phone, Company, Quantity, Gender, Country, **file upload**, Description  
- Submit → becomes a lead/order inquiry for Woo/WP (or email)  

---

## 2. Current Zayn storefront vs references

| Area | Today | Target (from refs) |
|------|--------|---------------------|
| Look | Cream / cognac boutique | Cleaner retail chrome + strong product photography (keep Zayn colors/fonts) |
| Header search | Icon → expand | Always-visible **centered** search |
| Cart in header | Icon only | Icon + **item count + cart total** |
| Nav | Shop mega-menu (text) | Men/Women mega-menus + **Custom Jackets** link |
| Home sections | Category tiles + grids | **Category carousels** (Best sellers, Men’s jackets, etc.) |
| PLP | Sidebar exists (good) | Add **price slider**, availability, breadcrumbs polish |
| Product card | Hover “View”, boutique frame | Simpler centered title/price; optional quick-add |
| Entry popup | None | Welcome / gift / newsletter modal |
| Custom jackets | None | Full page + nav highlight |
| Floating UI | Limited | Back-to-top + sticky bag |

**Keep (do not throw away):** Woo `shopApi` wiring, brand config, Shop sidebar base, PromoStrip, wishlist, checkout, account.

---

## 3. Design direction (important)

### Do
- Copy **layout patterns** from references (header, mega-menu, carousels, PLP, popup, custom form).
- Keep **Zayn** name, logo, cognac/cream accents, Outfit + Cormorant where they still feel premium.
- Shift chrome toward **cleaner white surfaces** for product grids so jackets read like the reference PLP.
- Use Indian commerce copy where needed (₹, “Free shipping over ₹X”, GST notes if settings say so).

### Don’t
- Rename the brand to “Real Leather Garments”.
- Paste UK £ pricing or their product photos as final assets.
- Overcrowd the first viewport (hero stays one composition: brand + one headline + one CTA + one image).
- Build a second custom Node backend — all new forms go through **Woo/WP plugin** or `shopApi`.

---

## 4. End-to-end workstreams

```
Phase A  Visual shell (header, promo, nav, floating UI) ✅
Phase B  Home experience (hero polish + category carousels) ✅
Phase C  Shop / PLP (filters, breadcrumbs, grid cards) ✅
Phase D  Entry popup (welcome / gift / email capture) ✅
Phase E  Custom Leather Jackets page + Woo lead API ✅
Phase F  PDP / Cart / Mobile polish + QA ✅
Phase G  Connect live client Woo data + smoke test (code-ready — see PHASE_G_GO_LIVE.md)
```

---

## 5. Phase A — Visual shell ✅ DONE

### A1. Promo strip ✅
- Always-on dark bar with brand fallback copy; settings override when active.

### A2. Header redesign ✅
**Layout:** `[Logo]  ……  [Search……………]  ……  [Wishlist] [Account] [Cart · count · ₹total]`

### A3. Primary navigation ✅
Men ▾ · New Arrivals · Women ▾ · Kids · Movie Jackets · Custom Leather Jackets · Contact

### A4. Mega-menu (Men / Women) ✅
4-column panel from brand fallback + live category tree when available.

### A5. Floating utilities ✅
Back-to-top + sticky mini-cart FAB.

**Stub:** `/custom-jackets` page (full form = Phase E).

---

## 6. Phase B — Home ✅ DONE

### B1. Hero ✅
- Full-bleed with serif/gold headline + italic highlight (“NEW / Arrival”), brand eyebrow, single CTA.

### B2. Category carousels ✅
- `ProductCarousel` with large `<` `>` arrows  
- Home sections: Best Selling, New Arrivals, Men’s, Women’s, Bags  

### B3. Product card ✅
- White card · centered name · bold centered price · wishlist on hover  

### B4. Instagram / reviews / vibe CTA
- Kept below carousels with lighter section borders.

---

## 7. Phase C — Shop / collection PLP ✅ DONE

### C1. Page chrome ✅
- Breadcrumbs (Home > Men > …) · page title · department chips · sort (Featured / Newest / Price)

### C2. Sidebar filters ✅
- Price range dual slider (from catalogue min/max)  
- Availability radios (All / In Stock / Out of Stock)  
- Department · nested categories · material · colour  

### C3. Grid ✅
- Desktop **4 columns** · tablet 3 · mobile 2 · 16 per page  

### C4. Empty / loading ✅
- Skeleton grid while catalogue loads · clear empty state + reset filters

---

## 8. Phase D — Entry popup ✅ DONE

### UX ✅
- Split modal (image | form) after ~1.8s on first visit  
- Gender radios · email · Unlock CTA · X / overlay / Esc / “No thanks”  
- Hidden on auth & checkout paths · `localStorage` key `zayn_welcome_popup_v1`  
- Mobile stacks image above form · focus trap via email autofocus + body scroll lock  

### Backend ✅
- `shopApi.subscribeNewsletter` → `POST zayn/v1/newsletter` (Woo) or Node `/api/newsletter` / contact fallback  
- WP plugin stores list option + `zayn_newsletter` CPT + admin email  

### Config
- Copy/image editable in `shared/brands/zayn-leathers.js` → `brand.popup`

---

## 9. Phase E — Custom Leather Jackets ✅ DONE

### E1. Route & nav ✅
- `/custom-jackets` · nav item ring-highlighted · breadcrumbs  

### E2. Form ✅
Name · Email · Phone · Company · Qty · Gender · Country · file upload · Description  

### E3. UX ✅
- Intro + sample image · style chips · strong Submit CTA · success + WhatsApp · file type/size checks  

### E4. Backend ✅
- `shopApi.submitCustomJacket` → `POST zayn/v1/custom-jacket` (multipart when file)  
- WP CPT `zayn_custom_request` + media attach + admin email  
- Node falls back to `/api/custom-jacket` or contact  

---

## 10. Phase F — PDP, cart, mobile, polish ✅

### PDP ✅
- Cleaner gallery + sticky buy box  
- Size selector clear; Custom CTA link (“Need a custom fit? →”) under Add to cart  

### Cart / checkout ✅
- Align totals row with header cart total (`Items` = `getCartAmount`)  
- Keep COD / Razorpay paths via `shopApi`  
- Mobile sticky checkout bar with matching merchandise total  

### Mobile ✅
- Hamburger with accordion mega categories  
- Search icon opens full-width search overlay  
- Popup full-screen friendly + focus trap  
- Carousel swipe  

### Motion ✅
- Intentional motions only (hero / carousel / popup); global `prefers-reduced-motion` in `index.css`  

### Accessibility ✅
- Focus trap on welcome popup  
- Mega-menu keyboard (Escape, ArrowDown, aria-expanded)  
- Form labels / search aria  

---

## 11. Phase G — Client backend go-live ✅ code-ready

Engineering prep done; **live smoke test waits on Hostinger**.

See full runbook: [`docs/PHASE_G_GO_LIVE.md`](./PHASE_G_GO_LIVE.md)

| # | Item | Status |
|---|------|--------|
| 1 | Map nav categories to Woo slugs (+ aliases) | ✅ code |
| 2 | Best Seller / New Arrivals via featured + tags | ✅ code |
| 3 | Popup + custom-jacket plugin endpoints | ✅ code (activate on WP) |
| 4 | Promo strip + free-shipping in Zayn settings | ✅ plugin admin |
| 5 | Hero/popup assets | ⚠️ placeholders until client files |
| 6 | Smoke test browse → checkout → forms | ⛔ blocked on live WC |

---

## 12. File / component map (planned)

| Action | Path |
|--------|------|
| Update | `components/Navbar.jsx` |
| Update | `components/SearchBar.jsx` / merge into Navbar |
| Update | `components/PromoStrip.jsx` |
| Update | `components/ProductItem.jsx` |
| Update | `pages/Home.jsx` |
| Update | `pages/Shop.jsx` |
| Update | `App.jsx` |
| New | `components/MegaMenu.jsx` |
| New | `components/ProductCarousel.jsx` |
| New | `components/WelcomePopup.jsx` |
| New | `components/BackToTop.jsx` |
| New | `components/FloatingCart.jsx` |
| New | `pages/CustomJackets.jsx` |
| Extend | `api/shopApi.js` (newsletter, custom jacket) |
| Extend | `wordpress/zayn-custom-api/zayn-custom-api.php` |
| Optional | `shared/brands/zayn-leathers.js` (nav labels, popup copy, mega-menu groups) |

---

## 13. Priority & effort

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Header + search + cart total | S |
| P0 | Nav + Custom Jackets link | S |
| P0 | Welcome popup | M |
| P0 | Custom Jackets page + API | M |
| P1 | Home product carousels | M |
| P1 | Mega-menu columns | M |
| P1 | PLP price slider + 4-col grid | M |
| P2 | Floating cart + back-to-top | S |
| P2 | PDP “custom fit” link + polish | S |
| P2 | Mobile drawer parity | M |
| P3 | Newsletter → auto coupon | M (needs Woo coupons) |

**Suggested build order:** A → D → E → B → C → F → G  

Rough calendar (one focused frontend track): **~1.5–2.5 weeks** to ship P0–P1 visually; Phase G depends on client Woo access.

---

## 14. Acceptance criteria

1. First visit shows branded welcome popup; dismiss persists.  
2. Header matches reference structure (logo · search · cart count/total).  
3. “Custom Leather Jackets” in nav opens polished form; submit reaches WP/admin email when plugin live.  
4. Home shows at least two product carousels with arrows.  
5. Men/Women mega-menu lists category groups.  
6. Shop: sidebar filters + 4-col desktop grid + breadcrumbs.  
7. No dependency on custom Node API for these features.  
8. Mobile usable for popup, custom form, shop filters, carousels.  
9. Brand still reads as **Zayn Leathers** (logo + name hero-level).  

---

## 15. Out of scope (for this UI pass)

- Rebuilding React admin  
- Full 3D jacket configurator (form + upload is enough for v1)  
- Cloning competitor product catalogue/photos  
- Changing payment/shipping providers  

---

## 16. Assets needed from client

- [ ] Hero / lifestyle images (web-optimized)  
- [ ] Popup left-side gift/product image  
- [ ] Final promo copy (free shipping threshold, gift value)  
- [ ] Confirm category list (Kids? Movie jackets? exact names)  
- [ ] Custom jacket sample photos (optional)  
- [ ] Woo URL + keys when ready  

---

## 17. Next step

**Phase A–F** ✅ · **Phase G** code-ready (live smoke blocked on Hostinger)

Runbook: [`docs/PHASE_G_GO_LIVE.md`](./PHASE_G_GO_LIVE.md)

When client shares Woo URL + keys: set Vercel env → install JWT + Zayn plugin → run smoke checklist.

Reference folder:  
`images/referenceimages/` · `Popup_at_start/` · `custom-option/`


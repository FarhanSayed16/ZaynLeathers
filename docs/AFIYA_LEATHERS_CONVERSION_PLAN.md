# Afiya Leathers — Complete Conversion & White-Label Plan

> **Brand spelling:** **Afiya Leathers** (as specified for this client).  
> Repo folder may still say `afiyaleathers` — that is fine; public brand string is **Afiya**.  
> **Goal:** Convert the current Totezie (cute totes) commerce stack into a premium leather storefront, with admin-managed mega-categories, while keeping the codebase easy to rebrand and resell to other clients.

---

## 0. Executive summary

| Item | Decision |
|------|----------|
| Product | Single-tenant e-commerce (frontend + admin + backend) |
| First client | **Afiya Leathers** |
| Sales model | **One deploy per client** (not multi-tenant SaaS) |
| Brand SSOT | `shared/brand.config.js` + `/public/brand/` assets |
| Theme | CSS variables driven by brand config (not hard-coded `tz-pink`) |
| Categories | **Hierarchical, admin-managed** (Men / Women / Bags / …) — no hard-coded Tote/Accessory enum |
| Product media | `organized_images/` (~169 products, ~512 files) → Cloudinary folder `afiya-leathers/` |
| Database | Same MongoDB Atlas cluster → **new DB** `afiyaleathers` |
| Cloudinary | Same cloud account → **new folder root** `afiya-leathers/` |
| Payments / shipping | Keep Razorpay + Shiprocket architecture; update display names |
| Cleanup | Remove Totezie/DudeDice leftovers, old plan docs, candy backups, tote seed images |

**What we keep:** cart, wishlist, checkout (COD / Razorpay / partial pay), orders, coupons, heroes, Instagram, reviews, site settings, OTP auth, Shiprocket hooks.

**What we change:** brand identity, visual system, category taxonomy, product schema enums, copy/SEO/emails, env targets, seed data, nav mega-menu.

---

## 1. Current state (baseline)

```
afiyaleathers/
├── frontend/     Vite + React storefront (still Totezie candy UI)
├── admin/        Vite + React admin panel
├── backend/      Express + Mongo + Cloudinary + Razorpay
├── shared/       brand.config.js (Totezie today)
├── organized_images/   ← Afiya product photos (USE THESE)
├── toteimages/         ← Totezie seed media (DELETE after migration)
├── _backups/           ← candy/professional snapshots (ARCHIVE/DELETE)
└── many totezie_*.md   ← old plans (ARCHIVE/DELETE after this plan is the SSOT)
```

### Hard blockers for leather today

1. Product `category` enum is locked: `Tote | Accessory | Bundle`.
2. Category `productType` enum is the same lock.
3. Shop chips, nav fallbacks, routes `/totes` `/accessories`, dashboard “Tote vs Accessory”.
4. Tailwind `tz-*` pink/cream + Fredoka/Nunito — brand.config colors are mostly unused.
5. Mongo URI currently points at DB `clothes` (old); Cloudinary folders use `totezie-*`.

### What already helps white-label

- Shared `brand.config.js` imported by frontend, admin, backend.
- Admin can manage heroes, Instagram, home tiles, fees, COD, partial pay.
- Subcategory CRUD exists (needs hierarchy upgrade for mega-menu).

---

## 2. Target brand — Afiya Leathers

### 2.1 Identity

| Field | Value |
|-------|--------|
| `id` | `afiya-leathers` |
| `name` | Afiya Leathers |
| `shortName` | Afiya |
| `legalName` | Afiya Leathers |
| `vertical` | `leather` |
| Tagline | *Crafted in leather. Made to last.* |
| Voice | Confident, material-led, premium but approachable — not luxury snobbery, not kawaii |

### 2.2 Design system (decided)

Avoid candy pink, Fredoka, gingham, and the common AI “cream + terracotta + serif” cliché. Direction: **atelier leather** — deep espresso, cognac, warm brass, charcoal type, full-bleed product photography.

| Token | Hex | Role |
|-------|-----|------|
| `--brand-primary` | `#6B3A2A` | Cognac — CTAs, links, accents |
| `--brand-secondary` | `#C4A574` | Brass/gold — highlights, dividers |
| `--brand-accent` | `#2C1810` | Espresso — strong UI chrome |
| `--brand-muted` | `#1C1917` | Near-black text |
| `--brand-background` | `#F3EEE6` | Warm parchment page ground |
| `--brand-surface` | `#FFFbf7` | Cards / panels when needed |
| `--brand-border` | `#D9D0C4` | Hairline borders |

**Typography**

| Role | Font | Why |
|------|------|-----|
| Heading | **Cormorant Garamond** | Editorial leather / apparel feel |
| Body / UI | **Outfit** | Clean modern sans; not Inter/Roboto |

Load via Google Fonts in `index.html`; also set in `brand.theme.fonts`.

**Motion (2–3 intentional)**

1. Hero image slow ken-burns / fade between slides.
2. Category mega-menu / tile fade-up on enter.
3. Product card image subtle zoom on hover.

**Homepage composition (keep structure, change content)**

1. Full-bleed hero (leather jackets / lifestyle).
2. Category entry tiles (Men / Women / Bags / Accessories).
3. New Arrivals.
4. Best Sellers / Premium strip.
5. Instagram (optional).
6. Reviews.

No dashboard clutter in the first viewport: brand + one headline + one line + one CTA + dominant image.

### 2.3 Logos & static brand assets

| Asset | Source / action |
|-------|-----------------|
| Navbar / footer / favicon | Client logo when provided; until then use wordmark “AFIYA” in Cormorant on dark espresso (generated SVG/PNG under `frontend/public/brand/`) |
| Heroes | Pick strongest jacket + bag shots from `organized_images/` |
| Category tiles | Crop representative images per Men / Women / Bags / Accessories |
| About | Founder/workshop imagery when available; else lifestyle leather flat-lay |
| **Do not use** | `BrandSamplelogo.png` (Totezie mascot), dice PNGs, tote candy heroes |

---

## 3. Category architecture (your full tree)

Admin must be able to add/edit/disable any node. Seed the tree below for Afiya so the mega-menu works immediately.

### 3.1 Data model change (required)

Replace flat `Tote|Accessory|Bundle` with a **tree**:

```text
Category {
  name, slug
  type: "department" | "group" | "category"   // Men = department, Men's Bags = group, Handbags = category
  parentId: ObjectId | null
  path: "men/leather-jackets"                 // for URLs & filters
  gender: "men" | "women" | "unisex" | null   // optional helper
  image, order, isActive
  showInNav: Boolean
  showInShop: Boolean
}
```

**Product fields (new shape)**

```text
Product {
  ...
  department: String,      // "men" | "women" | "bags" | "accessories" | "home-living" | ...
  categoryId: ObjectId,    // leaf category
  categorySlug: String,    // denormalized for fast shop filters
  gender: "men" | "women" | "unisex" | null,
  tags: String[],          // "best-sellers", "new-arrivals", "premium", "sale", "handmade", ...
  material, dimensions, color, sizes, ...
}
```

- Remove Mongoose enum `Tote | Accessory | Bundle`.
- Shop URL: `/shop?department=men&category=leather-jackets` (and/or `/shop/men/leather-jackets`).
- Collections & Sale can be **tag-driven** and/or dedicated category nodes (both supported).

### 3.2 Seed tree — Afiya Leathers

```text
SHOP
├── Men                          [department]
│   ├── Leather Jackets
│   ├── Suede Jackets
│   ├── Leather Blazers
│   ├── Leather Shirts
│   ├── Leather Pants
│   ├── Leather Shorts
│   ├── Leather Trench Coats
│   ├── Leather Vest Coats
│   ├── Leather Jumpsuits
│   └── Leather Aprons
├── Women                        [department]
│   ├── Leather Jackets
│   ├── Suede Jackets
│   ├── Leather Blazers
│   ├── Leather Dresses
│   ├── Leather Tops
│   ├── Leather Shirts
│   ├── Leather Pants
│   ├── Leather Shorts
│   ├── Leather Skirts
│   ├── Leather Trench Coats
│   ├── Leather Vest Coats
│   ├── Leather Jumpsuits
│   └── Leather Aprons
├── Bags                         [department]
│   ├── Men's Bags               [group]
│   │   ├── Office Bags
│   │   ├── Laptop Bags
│   │   ├── Messenger Bags
│   │   ├── Backpacks
│   │   └── Sling Bags
│   └── Women's Bags             [group]
│       ├── Handbags
│       ├── Tote Bags
│       ├── Satchel Bags
│       ├── Top Handle Bags
│       ├── Laptop Bags
│       ├── Backpacks
│       └── Sling Bags
├── Accessories                  [department]
│   ├── Wallets
│   ├── Belts
│   ├── Card Holders
│   ├── Keychains
│   ├── Passport Holders
│   ├── Gloves
│   └── Leather Accessories
├── Home & Living                [department]
│   ├── Leather Home Decor
│   ├── Cushions
│   ├── Storage Boxes
│   ├── Desk Accessories
│   └── Leather Trays
├── Collections                  [department]  (mostly tag/landing links)
│   ├── Celebrity Leather Jackets
│   ├── Best Sellers
│   ├── New Arrivals
│   ├── Premium Collection
│   ├── Limited Edition
│   ├── Handmade Collection
│   └── Suede Collection
├── Custom Made                  [department]
│   ├── Custom Jacket Order
│   ├── Custom Leather Apparel
│   ├── Custom Bags
│   └── Made-to-Measure
└── Sale                         [department]
    ├── Men's Sale
    ├── Women's Sale
    ├── Bags Sale
    └── Accessories Sale
```

### 3.3 Frontend nav

- Desktop: **SHOP** mega-menu (hover/click) with columns for Men / Women / Bags / Accessories + row links for Collections / Custom / Sale.
- Mobile: accordion drawers per department.
- Data source: `GET /api/categories/tree` (active nodes only) — **no hard-coded Totes/Accessories**.
- Fallback in `brand.catalog.nav` only if API empty (first boot).

### 3.4 Admin Categories page upgrades

- Tree view (indent by parent).
- Add child under selected parent.
- Fields: name, parent, type, image, order, showInNav, isActive.
- Bulk seed button (dev/admin only): “Load Afiya default tree” from `backend/seeds/afiyaCategories.js`.
- Products Add/Edit: pick department + leaf category from tree (searchable select).

---

## 4. Multi-client / white-label strategy

**Pattern: config-per-deploy (recommended for how you sell).**

| Per client | Where |
|------------|--------|
| Name, tagline, about, contact, SEO, emails | `shared/brand.config.js` |
| Colors, fonts | `brand.theme` → CSS variables |
| Logos, heroes, lifestyle | `frontend/public/brand/`, `admin/public/brand/` |
| Category seed (optional) | `backend/seeds/<client>Categories.js` |
| Secrets & domains | `.env` (Mongo DB name, Cloudinary folder prefix, Razorpay, SMTP, admin login) |
| Runtime content | Admin (products, heroes, tiles, fees) |

**Client swap checklist (future Client B)**

1. Copy brand config (or `brands/client-b.config.js` + one import line).
2. Replace `/public/brand/**`.
3. New Mongo DB name on same/new cluster.
4. New Cloudinary folder prefix `client-b/`.
5. New env admin email/password + CORS URLs.
6. Run category seed for that vertical (or empty + admin fills).
7. Deploy frontend / admin / backend.

**Out of scope for now:** true multi-tenant (one DB, hostname routing). Documented as future Option C only if SaaS pricing requires it.

Optional later structure:

```text
shared/
  brand.config.js          ← re-exports active brand
  brands/
    afiya-leathers.js
    client-b.js
```

---

## 5. Infrastructure — same accounts, new Afiya namespaces

### 5.1 MongoDB Atlas (existing cluster)

Current URI ends with `/clothes`.  
**Change DB name only** (same user/password/cluster):

```text
...mongodb.net/afiyaleathers?...
```

| Setting | Value |
|---------|--------|
| Database name | `afiyaleathers` |
| Collections | Created automatically on first write (`products`, `categories`, `orders`, `users`, …) |
| Old `clothes` / any `totezie` DB | Leave untouched (safe rollback) |

### 5.2 Cloudinary (existing cloud `dagb6rp9l`)

| Setting | Value |
|---------|--------|
| Cloud name | Keep existing |
| Folder root | `afiya-leathers/` |
| Subfolders | `products/`, `heroes/`, `categories/`, `instagram/`, `reviews/` |
| Old `totezie-*` folders | Leave; do not delete until Afiya is stable |

Update upload folder constants in `productController`, seed scripts, hero/instagram upload paths to use `brand.id` or `process.env.CLOUDINARY_FOLDER=afiya-leathers`.

### 5.3 Env files (update, do not commit secrets)

**`backend/.env`**

| Key | Afiya value |
|-----|----------------|
| `MONGODB_URI` | same cluster, DB → `afiyaleathers` |
| `CLOUDINARY_FOLDER` | `afiya-leathers` |
| `ADMIN_EMAIL` | `admin@afiyaleathers.com` |
| `ADMIN_PASSWORD` | `Afiya@Admin2026` (change before public deploy) |
| `FRONTEND_URL` | `http://localhost:5173` (local) |
| `ADMIN_URL` | `http://localhost:5174` (local) |
| `SHIPROCKET_RETURN_NAME` | `Afiya Leathers Warehouse` |
| Razorpay / SMTP | Keep existing test keys until live domain ready |

**`frontend/.env` / `admin/.env`**

- Keep `VITE_BACKEND_URL` pointing at local/prod API.
- Razorpay key same until live switch.

### 5.4 Test accounts (create & document)

| Role | Email | Password | How |
|------|-------|----------|-----|
| **Admin** | `admin@afiyaleathers.com` | `Afiya@Admin2026` | Env `ADMIN_EMAIL` / `ADMIN_PASSWORD` — login at admin `/` |
| **Admin (backup)** | `hello@afiyaleathers.com` | same password optional | Only if you want alias; primary is above |
| **Customer A** | `customer@test.com` | `Test@1234` | Register via storefront (OTP) or seed script |
| **Customer B** | `buyer@afiya.test` | `Test@1234` | Second account for order/wishlist tests |

Seed script: `backend/seeds/seedTestUsers.js` — creates customer users with bcrypt hash (skip OTP in seed when `ALLOW_DEV_OTP` or dedicated seed flag).

**QA login checklist**

1. Admin login → Dashboard, Add Product, Categories tree, Orders, Settings.
2. Customer register/login → cart → place COD order → appear in admin.
3. Wishlist + forgot password (SMTP must work).

---

## 6. Product media — `organized_images/`

| Metric | Approx |
|--------|--------|
| Product folders | ~169 |
| Image files | ~512 |

### Mapping strategy

1. Script `backend/seeds/importOrganizedImages.js`:
   - Walk each folder name → guess `gender`, leaf category, product title.
   - Upload images to Cloudinary `afiya-leathers/products/<slug>/`.
   - Create Product docs linked to seeded category slugs.
2. Heuristics examples:
   - Folder contains `Women` / `Women's` → gender women.
   - `Biker` / `Jacket` → Leather Jackets (or Suede if `Suede`).
   - `Sling` / `Tote` / `Laptop` / `Backpack` → Bags leaves.
   - `Tie` → Accessories / Leather Accessories.
   - Uncertain → tag `needs-review` + put under closest department; admin fixes in List/Edit.
3. Default sizes:
   - Apparel (jackets, pants, dresses): `S, M, L, XL, XXL`
   - Bags / accessories: `One Size` (or belt sizes if detectable later)
4. Prices: placeholder band (e.g. ₹2,999–₹14,999) + `oldPrice` optional; admin corrects.
5. Mark a subset `bestseller` / `featured` / tags `new-arrivals` for homepage.

**Manual QA after import:** spot-check 20 products across Men jackets, Women jackets, Bags, Accessories.

---

## 7. Phase-by-phase execution plan

### Phase 0 — Prep & cleanup (½–1 day)

**Goal:** Clean repo so leather work isn’t fighting Totezie noise.

| # | Task | Detail |
|---|------|--------|
| 0.1 | Make this file the SSOT plan | `AFIHYA_LEATHERS_CONVERSION_PLAN.md` |
| 0.2 | Delete / archive Totezie plan docs | Move `totezie_*.md`, old audits to `_archive/docs-totezie/` **or** delete if git history is enough |
| 0.3 | Remove candy root assets | `BrandSamplelogo.png`, `accessorycategory.png`, `totecateogry.png`, `sampleproduct.png` (unless needed for reference — prefer delete) |
| 0.4 | Remove `toteimages/` | After confirming `organized_images/` is complete |
| 0.5 | Remove or zip `_backups/` | Large candy/professional snapshots — not needed for Afiya |
| 0.6 | Purge frontend public leftovers | `dice.png`, `newdice.png`, `title-dice.png`, old tote heroes if unused |
| 0.7 | Update `.gitignore` | Ensure `.env`, `_archive/`, large image dumps if needed |
| 0.8 | Note: keep `organized_images/` | Source for seed; optionally gitignore later if too large for GitHub |

**Exit criteria:** Repo root is Afiya-focused; no dice/tote mascot assets in live `frontend/public`.

---

### Phase 1 — White-label foundation (1–2 days)

**Goal:** Changing brand config + assets actually rebrands the UI.

| # | Task | Detail |
|---|------|--------|
| 1.1 | Rewrite `shared/brand.config.js` | Afiya identity, leather vertical, cognac theme, fonts, contact placeholders, SEO, email subjects, commerce display name |
| 1.2 | Theme bridge | `applyBrandToDocument()` sets CSS vars; Tailwind colors map to `var(--brand-*)` in frontend + admin |
| 1.3 | Replace hard-coded Totezie strings | Register toast, PageHeader, Home/Shop SEO, Footer fallbacks, Banner, VibeCTA → leather CTA, SearchBar suggestions, Instagram handle, admin Login title |
| 1.4 | Fonts in HTML | Cormorant Garamond + Outfit; remove Fredoka/Nunito |
| 1.5 | `index.html` / sitemap / robots | Domain placeholders for Afiya; update OG tags |
| 1.6 | Backend emails / Shiprocket labels | Use `brand.email` / `brand.name` everywhere (OTP subjects included) |
| 1.7 | Cloudinary folder from env/brand | Stop hard-coding `totezie-products` |
| 1.8 | Client swap README | Update `shared/README.md` with Afiya + multi-client steps |

**Exit criteria:** Grep for `Totezie`, `totezie`, `tz-pink`, `Fredoka` in live `frontend/src`, `admin/src`, `backend` (non-archive) returns zero meaningful hits. Changing primary color in brand config visibly changes CTAs.

---

### Phase 2 — Category system + mega-menu (2–3 days)

**Goal:** Your full SHOP tree works and is admin-editable.

| # | Task | Detail |
|---|------|--------|
| 2.1 | New Category schema | `parentId`, `type` department/group/category, `path`, `gender`, `showInNav` |
| 2.2 | Product schema | Drop Tote/Accessory/Bundle enum; add `department`, `categoryId`, `categorySlug`, `gender`, keep `tags` |
| 2.3 | API | `GET /api/categories/tree`, CRUD with parent; validation for cycles |
| 2.4 | Seed | `backend/seeds/afiyaCategories.js` — full tree from §3.2 |
| 2.5 | Admin Categories UI | Tree UI + add child + reorder |
| 2.6 | Admin Add/Edit Product | Category tree picker; size presets by department |
| 2.7 | Admin List / Dashboard | Filters by department; revenue by department (not Tote vs Accessory) |
| 2.8 | Frontend Navbar | Mega-menu from tree API |
| 2.9 | Shop page | Filters: department, category, gender, tags, material, color, price |
| 2.10 | Routes | Remove `/totes` `/accessories`; add optional `/shop/:department/:category?` |
| 2.11 | SiteSettings category tiles | Default Men / Women / Bags / Accessories |

**Exit criteria:** Admin can add “Leather Capes” under Women without code change; shop filters work; mega-menu shows seeded tree.

---

### Phase 3 — Infra cutover + test users (½ day)

**Goal:** Fresh Afiya DB + Cloudinary namespace + logins.

| # | Task | Detail |
|---|------|--------|
| 3.1 | Point `MONGODB_URI` to `/afiyaleathers` | Same Atlas cluster |
| 3.2 | Set `CLOUDINARY_FOLDER=afiya-leathers` | Verify upload path |
| 3.3 | Set admin env credentials | §5.4 |
| 3.4 | Restart backend | Confirm connection string logs DB name |
| 3.5 | Run category seed | Tree appears in admin |
| 3.6 | Seed test customers | `customer@test.com` / `Test@1234` |
| 3.7 | Smoke login | Admin + customer |

**Exit criteria:** Empty Afiya DB except categories + test users; uploads land under `afiya-leathers/`.

---

### Phase 4 — Visual redesign storefront (2–3 days)

**Goal:** Site looks like a leather brand, not recolored Totezie.

| # | Task | Detail |
|---|------|--------|
| 4.1 | Global CSS | Parchment ground, cognac buttons, brass accents; remove gingham helpers |
| 4.2 | Hero | Full-bleed; leather photography; no floating badges |
| 4.3 | Category tiles | Four departments; real product crops |
| 4.4 | Product cards | Clean image-first; price; no candy chips |
| 4.5 | PDP | Size guide for jackets; material/dimensions prominent |
| 4.6 | About / Contact | Afiya copy from brand config |
| 4.7 | Footer / Navbar | Wordmark + mega-menu; leather tone |
| 4.8 | Admin skin | Match brand tokens lightly (professional, not candy) |
| 4.9 | VibeCTA → Leather CTA | e.g. “Jackets. Bags. Made to order.” |

**Exit criteria:** First viewport brand test passes (looks like Afiya even without reading nav). Mobile + desktop OK.

---

### Phase 5 — Import `organized_images` + homepage content (1–2 days)

| # | Task | Detail |
|---|------|--------|
| 5.1 | Import script | Upload + create products with best-effort category map |
| 5.2 | Heroes | Upload 3–4 heroes via admin or seed |
| 5.3 | Instagram / lifestyle | Optional from strongest bag/jacket shots |
| 5.4 | Homepage settings | Enable sections; set tiles |
| 5.5 | Manual category fix pass | Fix misfires from folder-name heuristics |
| 5.6 | Bestsellers / new tags | Mark ~8–12 products |

**Exit criteria:** Shop shows real leather products; jackets dominant; bags & accessories present.

---

### Phase 6 — Commerce QA & polish (1 day)

| # | Task | Detail |
|---|------|--------|
| 6.1 | Cart / checkout | COD + Razorpay test |
| 6.2 | Partial pay | If enabled in settings |
| 6.3 | Coupons | Create test coupon in admin |
| 6.4 | Order statuses | Admin updates + email subjects say Afiya |
| 6.5 | Wishlist / auth OTP | With SMTP |
| 6.6 | SEO pass | Titles, meta, sitemap |
| 6.7 | Performance | Cloudinary transforms already present — verify |

**Exit criteria:** Full purchase path works with test accounts; no Totezie strings in emails.

---

### Phase 7 — Client packaging (½ day)

| # | Task | Detail |
|---|------|--------|
| 7.1 | `CLIENT_SWAP_CHECKLIST.md` | Short operator checklist |
| 7.2 | Update `ENV_WHAT_YOU_NEED.md` | Afiya naming |
| 7.3 | Optional `shared/brands/` | Split configs for next sale |
| 7.4 | Document test logins | In checklist (not in public frontend) |

**Exit criteria:** You can hand a new client a clear “change these 7 things” list.

---

## 8. Cleanup inventory (exact)

### Delete or archive (Phase 0)

| Path | Action |
|------|--------|
| `totezie_*.md`, `full_audit.md`, `project_analysis.md`, `multi_tenant_white_label_readiness.md`, `client_handover_checklist.md` (Totezie-era) | Archive → `_archive/docs-totezie/` or delete |
| `_backups/**` | Delete or zip outside repo |
| `toteimages/**` | Delete after Afiya seed works |
| Root `BrandSamplelogo.png`, `*category.png`, `sampleproduct.png` | Delete |
| `frontend/public/dice.png`, `newdice.png`, `title-dice.png`, etc. | Delete |
| Candy lifestyle/heroes under `frontend/public/brand/` that are tote-specific | Replace with leather crops |

### Keep

| Path | Why |
|------|-----|
| `organized_images/` | Product seed source |
| `frontend/`, `admin/`, `backend/`, `shared/` | App |
| `AFIHYA_LEATHERS_CONVERSION_PLAN.md` | This plan |
| Commerce features (Razorpay, Shiprocket code) | Core product |

---

## 9. File touch map (implementation guide)

| Area | Primary files |
|------|----------------|
| Brand | `shared/brand.config.js`, `frontend/src/brand.js`, `admin/src/brand.js` |
| Theme | `frontend/tailwind.config.js`, `admin/tailwind.config.js`, `frontend/src/index.css`, `admin/src/index.css`, `frontend/index.html` |
| Categories | `backend/models/Category.js`, `backend/routes/categoryRoutes.js`, `admin/src/pages/Categories.jsx`, `frontend/src/components/Navbar.jsx` |
| Products | `backend/models/productModel.js`, `backend/controllers/productController.js`, `admin/src/pages/Add.jsx`, `Edit.jsx`, `List.jsx` |
| Shop | `frontend/src/pages/Shop.jsx`, `Home.jsx`, `Product.jsx`, `CategoryTiles.jsx` |
| Env | `backend/.env`, `frontend/.env`, `admin/.env`, `.env.example` files |
| Seeds | `backend/seeds/afiyaCategories.js`, `seedTestUsers.js`, `importOrganizedImages.js` |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Folder-name import mis-categorizes products | `needs-review` tag + admin fix pass |
| Breaking old Totezie DB | New DB name only; never drop `clothes` |
| Cloudinary quota | Same account; monitor; use transformations |
| Mega-menu complexity on mobile | Accordion; lazy render columns |
| Jacket sizes vs bag One Size | Size presets by department in admin |
| Logo not ready | Temporary typographic wordmark until client logo arrives |
| Large `organized_images` in git | Consider gitignore + local-only seed; document |

---

## 11. Success criteria (Definition of Done)

1. Storefront branded **Afiya Leathers** with cognac/espresso theme and Cormorant + Outfit.
2. SHOP mega-menu shows full Men / Women / Bags / Accessories / Home / Collections / Custom / Sale tree.
3. Admin can add new categories/products without code changes.
4. Mongo DB `afiyaleathers` + Cloudinary `afiya-leathers/` in use.
5. Admin login: `admin@afiyaleathers.com` / `Afiya@Admin2026`.
6. Customer test login works; test order completes.
7. Real products from `organized_images` visible in shop.
8. No Totezie/DudeDice candy branding in live UI.
9. `shared/README.md` + client swap checklist ready for next sale.
10. Old tote plans/backups/images cleaned or archived.

---

## 12. Suggested build order (when implementation starts)

```text
Phase 0 Cleanup
    → Phase 1 Brand + theme bridge
        → Phase 2 Category tree + mega-menu + product schema
            → Phase 3 Mongo/Cloudinary cutover + test users
                → Phase 4 Visual redesign
                    → Phase 5 Image import + heroes
                        → Phase 6 QA
                            → Phase 7 Packaging
```

**Do not skip Phase 1 before Phase 4** — otherwise design work fights hard-coded pink tokens.  
**Do not import products before Phase 2–3** — or they land in the wrong schema/DB.

---

## 13. Status (complete)

Phases **0–7** are implemented for Afiya Leathers:

| Phase | Status |
|-------|--------|
| 0 Cleanup | Done |
| 1 Brand + theme | Done (`shared/brands/afiya-leathers.js`) |
| 2 Category tree | Done (seeded) |
| 3 Infra + users | Done |
| 4 Visual redesign | Done |
| 5 Image import | Done (~169 products) |
| 6 Commerce QA polish | Done (dashboard, SEO, coupon `AFIYA10`, copy, mobile shop accordion) |
| 7 Client packaging | Done (`CLIENT_SWAP_CHECKLIST.md`, env docs) |

**Immediate next (ops):** smoke-test COD + Razorpay on local with seeded users; rotate admin password before production.

---

## 14. Suggested build order (historical)

```text
Phase 0 Cleanup
    → Phase 1 Brand + theme bridge
        → Phase 2 Category tree + mega-menu + product schema
            → Phase 3 Mongo/Cloudinary cutover + test users
                → Phase 4 Visual redesign
                    → Phase 5 Image import + heroes
                        → Phase 6 QA
                            → Phase 7 Packaging
```

**Do not skip Phase 1 before Phase 4** — otherwise design work fights hard-coded pink tokens.  
**Do not import products before Phase 2–3** — or they land in the wrong schema/DB.

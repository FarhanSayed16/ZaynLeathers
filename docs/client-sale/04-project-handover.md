<div align="center">

# PROJECT HANDOVER DOCUMENT

**Afiya Leathers — Online Store & Admin Panel**  
Fill dates on go-live · Give one copy to the Client

</div>

---

| Field | Detail |
|:---|:---|
| **Project** | Afiya Leathers — Online Store & Admin Panel |
| **Client** | Afiya Leathers — Mohd Alishan |
| **Service Provider** | Farhan Sayed · AI & Fullstack Engineer · Mumbai · +91 9867868597 |
| **Go-live date** | ________________ |
| **Warranty ends** | ________________ *(30 days after go-live)* |

---

## 1. Website URLs

| Item | URL |
|:---|:---|
| Customer storefront (production) | https://afiyaleathers.com *(or agreed live URL)* |
| Admin panel (production) | ________________ *(write live admin URL)* |
| Local storefront (dev) | http://localhost:5173 |
| Local admin (dev) | http://localhost:5174 |
| Backend API (dev) | http://localhost:5000 |

---

## 2. Admin access — change immediately

| Field | Value |
|:---|:---|
| Admin email / username | `afiyaleather8@gmail.com` |
| Temporary password | `Afiya@Admin2026` |

> **Important:** Change this password on first login. Do not post it publicly.  
> After handover, the Client is responsible for admin access security.

---

## 3. Related business contacts (from brand config)

| Item | Value |
|:---|:---|
| Public contact email | afiyaleather8@gmail.com |
| Phone / WhatsApp | +91 9768657387 |
| Business address | B.30 Ground Floor, Janta Chawl, K.K. Krishna Meman Marg, 90 Feet Road, Dharavi, Mumbai 400017 |
| Store hours | Monday – Saturday: 10AM – 7PM |

---

## 4. Accounts ownership checklist

Prefer **Client-owned** accounts for production.

| Service | Owner (Client / Provider) | Notes |
|:---|:---|:---|
| Domain `afiyaleathers.com` | | Client renews |
| DNS | | |
| Frontend hosting (e.g. Vercel) | | |
| Backend hosting (e.g. Render) | | Port / API URL |
| Database MongoDB (`afiyaleathers`) | | Do not share URI in public chat |
| Cloudinary folder `afiya-leathers` | | |
| Razorpay (settlements → Client) | | Live Key ID used in frontend env |
| Resend (`RESEND_API_KEY`) | | Domain `afiyaleathers.com` verified; from `orders@…` |
| Shiprocket | | Shipping enabled in project |

**Secrets** (Mongo password, Razorpay secret, Resend API key, JWT, Cloudinary secret, Shiprocket password) are **not** printed here. Transfer via password manager or in-person only.

---

## 5. Admin quick guide

| Task | Where |
|:---|:---|
| Add / edit products | Admin → Add / List / Edit |
| Categories | Admin → Categories |
| Orders & status | Admin → Orders |
| Coupons | Admin → Coupons · test code `AFIYA10` (10% off) |
| Heroes / homepage | Admin → Hero / Settings |
| Instagram promos | Admin → Instagram Promos |

Training completed on: ________________ · Mode: Online / In person  

---

## 6. What was delivered

- [ ] Branded Afiya Leathers storefront live  
- [ ] Admin panel live  
- [ ] Initial catalogue: ~169 products (confirm count on go-live)  
- [ ] Payments: Razorpay configured · COD as enabled  
- [ ] Email OTP / order mail: Working / Pending  
- [ ] Shiprocket: Enabled / Pending Client confirmation  
- [ ] Scope items completed as signed (QT-2026-AFIYA-001)  

---

## 7. Warranty & support

| Item | Detail |
|:---|:---|
| Warranty | Defects in agreed scope fixed free for **30 days** from go-live |
| Not covered | New features, third-party outages, Client misconfiguration |
| After warranty | AMC Rate Card (Basic ₹2,000 / Standard ₹4,000 / ₹750/hr) |
| Support | Farhan Sayed · +91 9867868597 · farhanbuilds16@gmail.com |

---

## 8. Client acknowledgement

I confirm I have received access to the website and admin panel, and I will change the temporary password and keep third-party accounts secure.

| | Client | Service Provider |
|:---|:---|:---|
| **Name** | Mohd Alishan (Afiya Leathers) | Farhan Sayed |
| **Signature** | | |
| **Date** | | |

---

<div align="center">

*Keep this document with business records. Do not upload secrets to public repos or social media.*

</div>

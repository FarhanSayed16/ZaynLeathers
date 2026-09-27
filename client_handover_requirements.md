# Client Handover Requirements & Credentials Guide

This document outlines every third-party account, API key, and credential you need from the client to fully deploy the Afiya Leathers e-commerce platform to production. 

> [!NOTE]
> You have already successfully gathered the **MongoDB** and **Cloudinary** credentials and migrated the data. They are included here just for your complete records!

---

## 1. Hosting Platforms (Deployment)

### Vercel (Frontend & Admin Panel Hosting)
*Used to host the React.js website and the admin dashboard on a global CDN.*
* **What you need:** Access to their GitHub account and Vercel account.
* **How to set up:**
  1. Have the client create a free account at [Vercel.com](https://vercel.com).
  2. You will push the final source code to a private GitHub repository on the client's account.
  3. Log into Vercel using their GitHub account, click "Add New Project", and import the frontend and admin repositories.

### Render (Backend Node.js Hosting)
*Used to host the Express.js server, API, and background processes.*
* **What you need:** Access to their Render.com account.
* **How to set up:**
  1. Have the client create an account at [Render.com](https://render.com).
  2. Connect it to their GitHub account.
  3. Create a new "Web Service", connect the backend repository, and paste the production `.env` variables there.

---

## 2. Payment Gateway

### Razorpay
*Used to process credit cards, UPI, and net banking payments securely.*
* **What you need:** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (Live Mode).
* **How to get them:**
  1. Log into the client's [Razorpay Dashboard](https://dashboard.razorpay.com/).
  2. Ensure the account is fully activated and KYC is approved (Live mode activated).
  3. Go to **Account & Settings** (bottom left) -> **API Keys** under the "Website and app settings" section.
  4. Click **Generate Live Key** (or Regenerate). 
  5. Copy the Key ID and Key Secret immediately (they are only shown once).

---

## 3. Shipping & Logistics

### Shiprocket
*Used to automatically calculate shipping rates, generate AWB tracking numbers, and book courier pickups.*
* **What you need:** `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`.
* **How to get them:**
  1. Have the client create a [Shiprocket](https://www.shiprocket.in/) account.
  2. Complete their KYC and add a pickup address.
  3. You simply need the **Email address** and **Password** they use to log into Shiprocket. The backend uses these to automatically generate authentication tokens on the fly.

---

## 4. Transactional Emails (OTP, resets, orders)

### Resend (production — required on Render)

Gmail SMTP is often blocked on Render. Production mail uses the **Resend HTTP API**.

* **What you need:** `RESEND_API_KEY`, `MAIL_PROVIDER=resend`, `EMAIL_FROM` on a verified domain (e.g. `Afiya Leathers <orders@afiyaleathers.com>`).
* **How to set up:**
  1. Create an account at [resend.com](https://resend.com).
  2. Add and verify `afiyaleathers.com` (SPF + DKIM DNS records Resend shows).
  3. Create an API key and set it on the Render service.
  4. Redeploy. Test register OTP to a real inbox.

Until the domain is verified, Resend only delivers reliably to your own test inbox using their sandbox from-address.

### Gmail SMTP (local fallback only)

Optional for local `MAIL_PROVIDER=smtp`. Not the production path.

---

## 5. Database & Media (Already Completed)

### MongoDB Atlas (Database)
*Used to store users, orders, products, and site settings.*
* **What you need:** `MONGODB_URI` connection string.
* **Status:** ✅ **Completed.** (You already migrated data to `cluster0.f15lco0.mongodb.net/afiyaleathers`)

### Cloudinary (Media Storage)
*Used to host and optimize product images and banners.*
* **What you need:** `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`.
* **Status:** ✅ **Completed.** (You already migrated to `ftwgmrrf`)

---

## Summary Checklist for the Client
Copy and paste this quick checklist to send to your client:

```text
Hi! To prepare for the final live launch, please provide the following credentials:

1. Razorpay Live API Keys (Key ID and Key Secret)
2. Shiprocket Login (Email and Password)
3. Google App Password (for the email address you want to send order confirmations from)
4. GitHub account access (so I can upload the final code)
5. Vercel & Render accounts (so I can launch the live servers)
```

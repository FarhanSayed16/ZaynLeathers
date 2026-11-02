# Deploy Zayn Leathers

The shop the customer sees is the React site. WordPress on Hostinger stays the place where products, orders, and customers are stored. Do not upload the React project into Hostinger’s file manager.

Do these steps in order. Stop after step 7 and test on the Vercel address before you touch the domain.

## Currency (important)

| Layer | Currency |
|---|---|
| WooCommerce product prices and orders | **INR** (stored) |
| Shop display default | **USD** |
| Customer can switch | **INR / USD / GBP / CAD** |
| Checkout charge (COD / Razorpay) | **INR** |

The shop converts INR prices for display using live exchange rates. When the customer views USD, GBP, or CAD, checkout still shows that they are charged in INR. Do not change the WooCommerce store currency to USD for launch. Do not rewrite the catalogue into dollars.

## Already done

- WooCommerce on Hostinger has the catalogue (about 1,420 published products) with INR prices.
- The React shop is built and talks to that WooCommerce store.
- Display defaults to USD; all four currencies remain in the header selector.
- The custom plugin is in this project at `wordpress/zayn-custom-api.zip`.

---

## 1. Confirm WooCommerce currency stays INR

WordPress → **WooCommerce → Settings → General**

- Currency: **Indian rupee (₹)**
- Keep the existing decimal and separator settings

Save if you changed anything. Leave product prices as they are.

## 2. Install the plugins

WordPress → **Plugins → Add New**.

| Plugin | Where it comes from | What it does |
|---|---|---|
| WooCommerce | Already installed | Products, orders, cash on delivery |
| JWT Authentication for WP-REST API | WordPress plugin directory | Customer login and account |
| Zayn Leathers Custom API | Upload `wordpress/zayn-custom-api.zip` | Wishlist, password reset, Razorpay, settings, exchange rates |

### Update / upload the Zayn custom plugin

Zip to upload (already rebuilt): `wordpress/zayn-custom-api.zip`

1. WordPress → **Plugins**.
2. If **Zayn Leathers Custom API** is already listed: click **Deactivate**, then **Delete**.
3. Click **Add New Plugin** → **Upload Plugin**.
4. Choose `zayn-custom-api.zip` → **Install Now** → **Activate**.
5. Open **Settings → Zayn Leathers** and save frontend URL, delivery fee, free-shipping threshold, and Razorpay keys.

If WordPress says the folder already exists, delete the old plugin first (step 2), then upload again.

If an older Zayn plugin is already active, deactivate it, delete it, then upload this zip and activate it.

You do not install a separate Razorpay WooCommerce plugin. Checkout uses the Zayn plugin.

You do not need a shipping-partner plugin for the shop to open. A courier such as Shiprocket is not connected yet. Orders can use free shipping or a flat rate you set in WooCommerce. Labels are created later in the courier’s own panel.

## 3. Allow customer login

Edit `wp-config.php` on Hostinger and add this above the line that says “That’s all, stop editing”:

```php
define('JWT_AUTH_SECRET_KEY', 'paste-a-long-random-string-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

Use a long random string. Do not reuse the WooCommerce API keys.

## 4. Shop settings in WordPress

WordPress → **Settings → Zayn Leathers**

- Frontend URL: the Vercel address from step 7. Change it to `https://zaynleather.com` only after step 9.
- Delivery fee: `41` (or the fee you want in rupees)
- Free shipping threshold: `2999` (or your chosen rupee amount)
- Razorpay Key ID and Key Secret: from the Razorpay dashboard, when that account is ready
- Promo message: something like `Free expedited shipping worldwide · Handcrafted leather`

Save.

Razorpay does not connect by itself. Until both keys are saved here, and the public key is also saved on Vercel, customers only see cash on delivery. Razorpay charges in INR, which matches the WooCommerce store.

## 5. WooCommerce keys, shipping, and cash on delivery

**WooCommerce → Settings → Advanced → REST API → Add key**

- Permissions: Read/Write
- Copy the consumer key and consumer secret into a password manager. They go on Vercel in step 7. They do not go in the website code or in git.

**WooCommerce → Settings → Shipping**

- Add a zone that covers the countries you ship to.
- Add free shipping and/or a flat rate in rupees.

**WooCommerce → Settings → Payments**

- Enable **Cash on delivery**.

## 6. Publish the shop on Vercel

Create a Vercel project from the `frontend` folder.

Environment variables:

```env
VITE_BACKEND_MODE=woocommerce
VITE_WC_URL=https://zaynleather.com
VITE_WC_CONSUMER_KEY=ck_...
VITE_WC_CONSUMER_SECRET=cs_...
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

Leave `VITE_RAZORPAY_KEY_ID` empty until the Razorpay account is ready. Redeploy after any change to these variables.

`VITE_WC_URL` stays `https://zaynleather.com` only while WordPress is still on that domain. After step 8 it becomes `https://wp.zaynleather.com`.

## 7. Test the Vercel address

Open the `*.vercel.app` link. Do not change DNS yet.

- Home, shop, and a product page load.
- Prices show in **USD** by default (converted from the INR catalogue).
- The header currency menu still offers INR, USD, GBP, and CAD.
- Switching currency updates prices; when not on INR, checkout notes that the charge is in INR.
- Add a size, open the cart, and place a cash-on-delivery order with a test customer.
- In WordPress → WooCommerce → Orders, that order is in INR and the total matches the cart’s INR amount.
- Log in and open Account → Orders.
- If Razorpay keys are saved, pay for one small order and confirm it is paid in INR.

## 8. Move WordPress off the main domain

`zaynleather.com` currently opens the WordPress site. The shop needs that address, and the shop also needs WordPress at a different address for products and orders.

On Hostinger, move WordPress to `wp.zaynleather.com` and confirm this opens:

`https://wp.zaynleather.com/wp-json`

Then in Vercel set:

```env
VITE_WC_URL=https://wp.zaynleather.com
```

Redeploy. In **Settings → Zayn Leathers**, you can leave the frontend URL as the Vercel address until the next step.

## 9. Point the domain at the shop

Only after step 7 passes on the new `VITE_WC_URL`.

In Vercel, add `zaynleather.com` and `www.zaynleather.com`.

In Hostinger DNS, use the records Vercel shows. They are usually:

| Type | Name | Value |
|---|---|---|
| A | `@` | the IP Vercel shows |
| CNAME | `www` | `cname.vercel-dns.com` |

Do not change the nameservers. Do not delete mail records.

After HTTPS is valid, set **Settings → Zayn Leathers → Frontend URL** to `https://zaynleather.com` and save.

## What you do not upload

- The React source, and the Vite `dist` folder, stay off Hostinger.
- The product photo folders stay off git and off the public site. The photos are already on WooCommerce.
- The React admin and the Node backend are not part of this launch.

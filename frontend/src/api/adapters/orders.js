/**
 * ============================================================
 * Orders Adapter — WooCommerce ↔ Frontend
 * ============================================================
 * Creates and retrieves orders via the WooCommerce REST API.
 * Handles COD, Razorpay, and partial payment flows.
 * ============================================================
 */

import { wcUrl, request, authRequest, wpUrl } from "../wooClient.js";

/**
 * Map a WooCommerce order → frontend order shape.
 *
 * Your frontend expects:
 * { _id, items, amount, address, status, paymentMethod, date, payment, tracking }
 */
function mapOrder(wc) {
  return {
    _id: String(wc.id),
    orderNumber: wc.number || String(wc.id),
    status: mapOrderStatus(wc.status),
    wcStatus: wc.status,
    date: wc.date_created,
    amount: Number(wc.total || 0),
    subtotal: Number(wc.subtotal || 0),
    shippingTotal: Number(wc.shipping_total || 0),
    discountTotal: Number(wc.discount_total || 0),
    paymentMethod: wc.payment_method || "cod",
    paymentMethodTitle: wc.payment_method_title || "",
    currency: wc.currency || "INR",
    items: (wc.line_items || []).map((li) => ({
      _id: String(li.product_id),
      name: li.name,
      price: Number(li.price || 0),
      quantity: li.quantity,
      size: extractSizeMeta(li),
      image: li.image?.src ? [li.image.src] : [],
      sku: li.sku || "",
    })),
    address: mapWcAddress(wc.shipping || wc.billing),
    billing: mapWcAddress(wc.billing),
    tracking: extractTrackingMeta(wc),
    payment: {
      paid: wc.date_paid != null,
      datePaid: wc.date_paid,
      transactionId: wc.transaction_id || "",
    },
    couponLines: (wc.coupon_lines || []).map((c) => ({
      code: c.code,
      discount: Number(c.discount || 0),
    })),
    customerNote: wc.customer_note || "",
    _wc: wc,
  };
}

/**
 * Place a COD order.
 * @param {Object} orderData - { address, items, amount, couponCode, billing }
 * @param {string} token
 */
export async function placeCodOrder(orderData, token) {
  const wcOrder = buildOrderPayload(orderData, "cod");

  // Get customer info
  const wpUser = await authRequest(wpUrl("wp/v2/users/me"), token);
  wcOrder.customer_id = wpUser.id;

  const url = wcUrl("orders");
  const created = await request(url, {
    method: "POST",
    body: JSON.stringify(wcOrder),
  });

  return {
    success: true,
    orderId: String(created.id),
    order: mapOrder(created),
  };
}

/**
 * Create a Razorpay order (prepaid).
 * This calls a custom WP REST endpoint that:
 * 1. Creates a WooCommerce order with "pending" status
 * 2. Creates a Razorpay order via their API
 * 3. Returns the Razorpay order details for frontend checkout
 *
 * @param {Object} orderData
 * @param {string} token
 */
export async function createRazorpayOrder(orderData, token) {
  const url = wpUrl("zayn/v1/razorpay/create-order");

  const payload = {
    ...buildOrderPayload(orderData, "razorpay"),
    amount: orderData.amount,
  };

  return authRequest(url, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Verify a Razorpay payment.
 * @param {Object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature, ... }
 * @param {string} token
 */
export async function verifyRazorpayPayment(paymentData, token) {
  const url = wpUrl("zayn/v1/razorpay/verify");
  return authRequest(url, token, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

/**
 * Create a partial payment (advance) order.
 * @param {Object} orderData
 * @param {number} amount
 * @param {string} token
 */
export async function createPartialOrder(orderData, amount, token) {
  const url = wpUrl("zayn/v1/razorpay/create-partial");
  return authRequest(url, token, {
    method: "POST",
    body: JSON.stringify({ ...orderData, amount }),
  });
}

/**
 * Verify partial payment.
 * @param {Object} paymentData
 * @param {string} token
 */
export async function verifyPartialPayment(paymentData, token) {
  const url = wpUrl("zayn/v1/razorpay/verify-partial");
  return authRequest(url, token, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

/**
 * Get all orders for the current customer.
 * @param {string} token
 */
export async function getOrders(token) {
  // Get the WP user to find their customer ID
  const wpUser = await authRequest(wpUrl("wp/v2/users/me"), token);

  const url = wcUrl("orders", {
    customer: wpUser.id,
    per_page: 50,
    orderby: "date",
    order: "desc",
  });

  const orders = await request(url);
  return orders.map(mapOrder);
}

/**
 * Get a single order by ID.
 * @param {string} orderId
 * @param {string} token
 */
export async function getOrder(orderId, token) {
  const url = wcUrl(`orders/${orderId}`);
  const wc = await request(url);
  return mapOrder(wc);
}

// ────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────

function buildOrderPayload(orderData, paymentMethod) {
  const { address, items, couponCode, billing } = orderData;

  const wcBilling = {
    first_name: address.firstName || "",
    last_name: address.lastName || "",
    address_1: address.street || "",
    address_2: address.apartment || "",
    city: address.city || "",
    state: address.state || "",
    postcode: address.zipcode || "",
    country: address.country === "India" ? "IN" : address.country || "IN",
    email: address.email || "",
    phone: address.phone || "",
  };

  const wcShipping = {
    first_name: address.firstName || "",
    last_name: address.lastName || "",
    address_1: address.street || "",
    address_2: address.apartment || "",
    city: address.city || "",
    state: address.state || "",
    postcode: address.zipcode || "",
    country: address.country === "India" ? "IN" : address.country || "IN",
  };

  const lineItems = items.map((item) => ({
    product_id: Number(item._id),
    quantity: item.quantity,
    // Size as meta data
    meta_data: [{ key: "Size", value: item.size }],
  }));

  const order = {
    payment_method: paymentMethod,
    payment_method_title:
      paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay",
    set_paid: paymentMethod === "cod",
    status: paymentMethod === "cod" ? "processing" : "pending",
    billing: wcBilling,
    shipping: wcShipping,
    line_items: lineItems,
    meta_data: [],
  };

  // Add GSTIN billing info
  if (billing?.gstin) {
    order.meta_data.push({ key: "_billing_gstin", value: billing.gstin });
  }
  if (billing?.companyName) {
    wcBilling.company = billing.companyName;
  }

  // Add coupon
  if (couponCode) {
    order.coupon_lines = [{ code: couponCode }];
  }

  return order;
}

function mapOrderStatus(wcStatus) {
  const statusMap = {
    pending: "Pending",
    processing: "Order Placed",
    "on-hold": "On Hold",
    completed: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
    failed: "Failed",
    // Custom statuses (if added via plugin)
    shipped: "Shipped",
    "out-for-delivery": "Out for Delivery",
  };
  return statusMap[wcStatus] || wcStatus;
}

function mapWcAddress(wcAddr) {
  if (!wcAddr) return {};
  return {
    firstName: wcAddr.first_name || "",
    lastName: wcAddr.last_name || "",
    email: wcAddr.email || "",
    phone: wcAddr.phone || "",
    street: wcAddr.address_1 || "",
    apartment: wcAddr.address_2 || "",
    city: wcAddr.city || "",
    state: wcAddr.state || "",
    zipcode: wcAddr.postcode || "",
    country: wcAddr.country === "IN" ? "India" : wcAddr.country || "",
  };
}

function extractSizeMeta(lineItem) {
  const sizeMeta = (lineItem.meta_data || []).find(
    (m) => m.key.toLowerCase() === "size" || m.key === "pa_size"
  );
  return sizeMeta?.value || "Free Size";
}

function extractTrackingMeta(wc) {
  const trackingMeta = (wc.meta_data || []).find(
    (m) => m.key === "_tracking_number" || m.key === "_shipment_tracking"
  );
  const courierMeta = (wc.meta_data || []).find(
    (m) => m.key === "_tracking_provider" || m.key === "_courier_name"
  );

  if (!trackingMeta?.value) return null;

  return {
    trackingNumber: trackingMeta.value,
    courier: courierMeta?.value || "",
    trackingUrl:
      (wc.meta_data || []).find((m) => m.key === "_tracking_url")?.value || "",
  };
}

export { mapOrder };

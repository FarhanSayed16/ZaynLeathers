/**
 * Shiprocket shipping provider.
 * Docs: https://apidocs.shiprocket.in/
 */

const DEFAULT_BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiresAt = 0;

function getBaseUrl() {
  return (process.env.SHIPROCKET_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

function assertCredentials() {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    const err = new Error("Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
    err.code = "SHIPROCKET_CONFIG";
    throw err;
  }
}

async function srFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      `Shiprocket API error (${res.status})`;
    const err = new Error(typeof message === "object" ? JSON.stringify(message) : message);
    err.code = "SHIPROCKET_API";
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

async function getToken() {
  assertCredentials();

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const data = await srFetch("/auth/login", {
    method: "POST",
    body: {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    },
  });

  if (!data?.token) {
    const err = new Error("Shiprocket login failed — no token returned");
    err.code = "SHIPROCKET_AUTH";
    throw err;
  }

  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

function defaultPackage(order) {
  const s = order?.shipping || {};
  return {
    length: Number(s.length || process.env.SHIPROCKET_DEFAULT_LENGTH || 30),
    breadth: Number(s.breadth || process.env.SHIPROCKET_DEFAULT_BREADTH || 25),
    height: Number(s.height || process.env.SHIPROCKET_DEFAULT_HEIGHT || 8),
    weight: Number(s.weight || process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5),
  };
}

function mapAddress(order, userEmail) {
  const a = order.address || {};
  const phone = digitsOnly(a.phone).slice(-10);
  const pincode = digitsOnly(a.zipcode || a.pincode);

  if (phone.length !== 10) {
    const err = new Error("Customer phone must be a valid 10-digit Indian number for shipping.");
    err.code = "INVALID_ADDRESS";
    throw err;
  }
  if (pincode.length !== 6) {
    const err = new Error("Customer pincode/zipcode must be a valid 6-digit Indian PIN.");
    err.code = "INVALID_ADDRESS";
    throw err;
  }

  return {
    billing_customer_name: a.firstName || a.name || "Customer",
    billing_last_name: a.lastName || "",
    billing_address: a.street || a.address || "",
    billing_address_2: a.apartment || a.address2 || "",
    billing_city: a.city || "",
    billing_pincode: pincode,
    billing_state: a.state || "",
    billing_country: a.country || "India",
    billing_email: userEmail || a.email || process.env.ADMIN_EMAIL || "orders@afiyaleather.com",
    billing_phone: phone,
    shipping_is_billing: true,
  };
}

function mapOrderItems(order) {
  const active = (order.items || []).filter((i) => i.status !== "Cancelled");
  if (!active.length) {
    const err = new Error("No shippable items on this order (all cancelled).");
    err.code = "NO_ITEMS";
    throw err;
  }

  return active.map((item) => ({
    name: item.name || "Product",
    sku: String(item.productId || item._id),
    units: item.quantity,
    selling_price: item.price,
  }));
}

function mapReturnItems(order) {
  const delivered = (order.items || []).filter((i) =>
    ["Delivered", "ReturnRequested", "ReturnInTransit"].includes(i.status)
  );
  if (!delivered.length) {
    const err = new Error("No delivered items available to return.");
    err.code = "NO_ITEMS";
    throw err;
  }
  return delivered.map((item) => ({
    name: item.name || "Product",
    sku: String(item.productId || item._id),
    units: item.quantity,
    selling_price: item.price,
  }));
}

function buildTrackingUrl(awb) {
  if (!awb) return null;
  return `https://shiprocket.co/tracking/${awb}`;
}

function extractAwbPayload(awbData) {
  const response = awbData?.response?.data || awbData?.response || awbData || {};
  const awbCode = response.awb_code || response.awb || awbData?.awb_code || null;
  const courierName =
    response.courier_name || response.courier_company_id || awbData?.courier_name || null;
  const freightCharge =
    Number(response.freight_charge ?? response.rate ?? awbData?.freight_charge ?? 0) || null;
  return { awbCode, courierName, freightCharge, response };
}

/**
 * Create Shiprocket adhoc order + assign AWB.
 * Partial payment orders: COD with collectable = balance only (advance already paid).
 */
async function createShipment(order, { userEmail } = {}) {
  const token = await getToken();
  const addressFields = mapAddress(order, userEmail);
  let orderItems = mapOrderItems(order);
  const pkg = defaultPackage(order);

  const method = String(order.paymentMethod || "").toUpperCase();
  const isPartial = method === "PARTIAL";
  const balance = Number(order.paymentDetails?.balanceAmount);
  const hasBalance = isPartial && Number.isFinite(balance) && balance > 0;
  const isCod = method === "COD" || hasBalance;
  const collectable = hasBalance
    ? Math.round(balance)
    : method === "COD"
      ? Math.round(Number(order.amount) || 0)
      : 0;

  // Scale line items so Shiprocket COD total matches collectable (balance or full COD)
  if (isCod && collectable > 0 && orderItems.length) {
    const rawSum = orderItems.reduce((s, i) => s + i.selling_price * i.units, 0) || 1;
    let allocated = 0;
    orderItems = orderItems.map((item, idx) => {
      if (idx === orderItems.length - 1) {
        const selling_price = Math.max(1, Math.round(collectable - allocated)) / item.units;
        return {
          ...item,
          selling_price: Math.max(1, Math.round(selling_price * 100) / 100),
        };
      }
      const share = (item.selling_price * item.units) / rawSum;
      const lineTotal = Math.round(collectable * share);
      allocated += lineTotal;
      return {
        ...item,
        selling_price: Math.max(1, Math.round((lineTotal / item.units) * 100) / 100),
      };
    });
  }

  const pickup =
    process.env.SHIPROCKET_PICKUP_LOCATION ||
    process.env.SHIPROCKET_RETURN_LOCATION ||
    "Primary";

  const commentParts = [`Zayn Leathers order ${order._id}`];
  if (isPartial) {
    commentParts.push(
      `Partial: advance ₹${order.paymentDetails?.advanceAmount ?? "?"} paid; COD collect ₹${collectable}`
    );
  }

  const payload = {
    order_id: String(order._id),
    order_date: new Date(order.date || order.createdAt || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    pickup_location: pickup,
    channel_id: "",
    comment: commentParts.join(" | "),
    ...addressFields,
    order_items: orderItems,
    payment_method: isCod ? "COD" : "Prepaid",
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: isCod ? collectable : Math.round(Number(order.amount) || 0),
    length: pkg.length,
    breadth: pkg.breadth,
    height: pkg.height,
    weight: pkg.weight,
  };

  const created = await srFetch("/orders/create/adhoc", {
    method: "POST",
    token,
    body: payload,
  });

  const shiprocketOrderId = created?.order_id != null ? String(created.order_id) : null;
  const shipmentId = created?.shipment_id != null ? String(created.shipment_id) : null;

  if (!shipmentId) {
    const err = new Error(
      created?.message || "Shiprocket did not return a shipment_id. Check pickup location & address."
    );
    err.code = "SHIPROCKET_CREATE";
    err.payload = created;
    throw err;
  }

  let awbData = {};
  try {
    awbData = await srFetch("/courier/assign/awb", {
      method: "POST",
      token,
      body: { shipment_id: shipmentId },
    });
  } catch (awbErr) {
    return {
      partner: "shiprocket",
      shiprocketOrderId,
      shipmentId,
      awbCode: null,
      courierName: null,
      trackingUrl: null,
      status: created?.status || "NEW",
      labelUrl: null,
      pickupScheduled: false,
      freightCharge: null,
      package: pkg,
      raw: { created, awbError: awbErr.message },
      warning: awbErr.message,
    };
  }

  const { awbCode, courierName, freightCharge, response } = extractAwbPayload(awbData);

  return {
    partner: "shiprocket",
    shiprocketOrderId,
    shipmentId,
    awbCode: awbCode ? String(awbCode) : null,
    courierName: courierName ? String(courierName) : null,
    trackingUrl: buildTrackingUrl(awbCode),
    status: response.status || created?.status || "AWB_ASSIGNED",
    labelUrl: null,
    pickupScheduled: false,
    freightCharge,
    package: pkg,
    raw: { created, awbData },
  };
}

async function generateLabel({ shipmentId }) {
  if (!shipmentId) {
    const err = new Error("shipmentId required to generate label");
    err.code = "INVALID_INPUT";
    throw err;
  }
  const token = await getToken();
  const data = await srFetch("/courier/generate/label", {
    method: "POST",
    token,
    body: { shipment_id: [Number(shipmentId) || shipmentId] },
  });
  const labelUrl =
    data?.label_url ||
    data?.label_download?.label ||
    data?.response?.label_url ||
    (Array.isArray(data?.label_url) ? data.label_url[0] : null) ||
    null;
  return { labelUrl, raw: data };
}

async function requestPickup({ shipmentId }) {
  if (!shipmentId) {
    const err = new Error("shipmentId required to request pickup");
    err.code = "INVALID_INPUT";
    throw err;
  }
  const token = await getToken();
  const data = await srFetch("/courier/generate/pickup", {
    method: "POST",
    token,
    body: { shipment_id: [Number(shipmentId) || shipmentId] },
  });
  return {
    pickupScheduled: true,
    pickupStatus: data?.pickup_status || data?.response?.pickup_status || "SCHEDULED",
    raw: data,
  };
}

async function trackShipment({ awbCode }) {
  if (!awbCode) {
    return { events: [], status: null };
  }
  const token = await getToken();
  const data = await srFetch(`/courier/track/awb/${awbCode}`, { token });
  const tracking = data?.tracking_data || data || {};
  return {
    status: tracking?.track_status || tracking?.shipment_status || null,
    events: tracking?.shipment_track || tracking?.track || [],
    raw: data,
  };
}

async function cancelShipment({ awbCode, shiprocketOrderIds = [] }) {
  const token = await getToken();
  if (awbCode) {
    return srFetch("/orders/cancel/shipment/awbs", {
      method: "POST",
      token,
      body: { awbs: [awbCode] },
    });
  }
  if (shiprocketOrderIds.length) {
    return srFetch("/orders/cancel", {
      method: "POST",
      token,
      body: { ids: shiprocketOrderIds.map((id) => Number(id) || id) },
    });
  }
  return { cancelled: false };
}

/**
 * Reverse pickup: customer → hub → manufacturer (return location).
 * Shiprocket: POST /orders/create/return
 */
async function createReturn(order, { userEmail, reason } = {}) {
  const token = await getToken();
  const a = order.address || {};
  const phone = digitsOnly(a.phone).slice(-10);
  const pincode = digitsOnly(a.zipcode || a.pincode);
  const pkg = defaultPackage(order);
  const orderItems = mapReturnItems(order);

  if (phone.length !== 10 || pincode.length !== 6) {
    const err = new Error("Customer address phone/pincode invalid for return pickup.");
    err.code = "INVALID_ADDRESS";
    throw err;
  }

  const payload = {
    order_id: `RET-${order._id}`,
    order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    channel_id: "",
    pickup_customer_name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Customer",
    pickup_last_name: a.lastName || "",
    pickup_address: a.street || a.address || "",
    pickup_address_2: a.apartment || "",
    pickup_city: a.city || "",
    pickup_state: a.state || "",
    pickup_country: a.country || "India",
    pickup_pincode: pincode,
    pickup_email: userEmail || a.email || process.env.ADMIN_EMAIL,
    pickup_phone: phone,
    shipping_customer_name: process.env.SHIPROCKET_RETURN_NAME || "Zayn Leathers Warehouse",
    shipping_last_name: "",
    shipping_address: process.env.SHIPROCKET_RETURN_ADDRESS || "Manufacturer / Production",
    shipping_address_2: "",
    shipping_city: process.env.SHIPROCKET_RETURN_CITY || "",
    shipping_state: process.env.SHIPROCKET_RETURN_STATE || "",
    shipping_country: "India",
    shipping_pincode:
      digitsOnly(process.env.SHIPROCKET_PICKUP_PINCODE || process.env.SHIPROCKET_RETURN_PINCODE || "") ||
      pincode,
    shipping_email: process.env.ADMIN_EMAIL || userEmail,
    shipping_phone: digitsOnly(process.env.SHIPROCKET_RETURN_PHONE || "").slice(-10) || phone,
    order_items: orderItems,
    payment_method: "Prepaid",
    sub_total: orderItems.reduce((sum, i) => sum + i.selling_price * i.units, 0),
    length: pkg.length,
    breadth: pkg.breadth,
    height: pkg.height,
    weight: pkg.weight,
    comment: reason || `Return for Zayn Leathers order ${order._id}`,
  };

  const created = await srFetch("/orders/create/return", {
    method: "POST",
    token,
    body: payload,
  });

  const shiprocketOrderId = created?.order_id != null ? String(created.order_id) : null;
  const shipmentId = created?.shipment_id != null ? String(created.shipment_id) : null;

  let awbCode = null;
  let courierName = null;
  let freightCharge = null;

  if (shipmentId) {
    try {
      const awbData = await srFetch("/courier/assign/awb", {
        method: "POST",
        token,
        body: { shipment_id: shipmentId },
      });
      const extracted = extractAwbPayload(awbData);
      awbCode = extracted.awbCode ? String(extracted.awbCode) : null;
      courierName = extracted.courierName ? String(extracted.courierName) : null;
      freightCharge = extracted.freightCharge;
    } catch {
      // return order may exist without AWB yet
    }
  }

  return {
    partner: "shiprocket",
    shiprocketOrderId,
    shipmentId,
    awbCode,
    courierName,
    trackingUrl: buildTrackingUrl(awbCode),
    status: created?.status || "RETURN_CREATED",
    freightCharge,
    raw: created,
  };
}

/**
 * Check if delivery pincode is serviceable from warehouse pickup pincode.
 */
async function checkServiceability({
  deliveryPincode,
  weight = 0.5,
  cod = false,
  pickupPincode,
} = {}) {
  const pickup =
    digitsOnly(pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || "");
  const delivery = digitsOnly(deliveryPincode);

  if (pickup.length !== 6 || delivery.length !== 6) {
    const err = new Error(
      "Valid 6-digit pickup and delivery pincodes required (set SHIPROCKET_PICKUP_PINCODE)."
    );
    err.code = "INVALID_PINCODE";
    throw err;
  }

  const token = await getToken();
  const qs = new URLSearchParams({
    pickup_postcode: pickup,
    delivery_postcode: delivery,
    cod: cod ? "1" : "0",
    weight: String(weight),
  });

  const data = await srFetch(`/courier/serviceability/?${qs.toString()}`, { token });
  const available = data?.data?.available_courier_companies || data?.available_courier_companies || [];
  const recommended =
    data?.data?.recommended_courier_company_id ||
    data?.recommended_courier_company_id ||
    null;

  const couriers = (Array.isArray(available) ? available : []).map((c) => ({
    id: c.courier_company_id,
    name: c.courier_name,
    rate: Number(c.rate) || 0,
    etd: c.etd || c.estimated_delivery_days || null,
    etdHours: c.etd_hours || null,
    cod: Boolean(c.cod),
  }));

  couriers.sort((a, b) => a.rate - b.rate);
  const cheapest = couriers[0] || null;
  const recommendedCourier =
    couriers.find((c) => String(c.id) === String(recommended)) || cheapest;

  return {
    serviceable: couriers.length > 0,
    pickupPincode: pickup,
    deliveryPincode: delivery,
    couriers,
    cheapest,
    recommended: recommendedCourier,
    estimatedDays: recommendedCourier?.etd || cheapest?.etd || null,
    estimatedRate: recommendedCourier?.rate ?? cheapest?.rate ?? null,
    raw: data,
  };
}

async function getCourierRates(opts) {
  return checkServiceability(opts);
}

const shiprocketProvider = {
  name: "shiprocket",
  createShipment,
  generateLabel,
  requestPickup,
  trackShipment,
  cancelShipment,
  createReturn,
  checkServiceability,
  getCourierRates,
  buildTrackingUrl,
};

export default shiprocketProvider;

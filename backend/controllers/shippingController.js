import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { sendEmail } from "../utils/mailer.js";
import brand from "../../shared/brand.config.js";
import { maybeAutoInvoiceAfterDelivery } from "../utils/invoicing/issueInvoiceForOrder.js";
import {
  getShippingConfig,
  getShippingProvider,
  isShippingEnabled,
  isDynamicRatesEnabled,
  mapPartnerStatusToBrand,
} from "../services/shipping/index.js";

const requireShippingEnabled = (res) => {
  if (!isShippingEnabled()) {
    res.status(409).json({
      success: false,
      message: "Shipping partner is disabled. Set SHIPPING_ENABLED=true in backend .env.",
    });
    return false;
  }
  return true;
};

const loadOrder = async (orderId) => orderModel.findById(orderId);

/** Public: admin/storefront reads this to show/hide shipping UI */
export const getConfig = async (_req, res) => {
  try {
    return res.json({ success: true, ...getShippingConfig() });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/**
 * Admin: create shipment via active partner.
 * Optional body: { weight, length, breadth, height }
 */
export const createShipment = async (req, res) => {
  try {
    if (!requireShippingEnabled(res)) return;

    const { orderId } = req.params;
    const order = await loadOrder(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.shipping?.awbCode || order.shipping?.shipmentId) {
      return res.json({
        success: false,
        message: "Shipment already exists for this order",
        shipping: order.shipping,
      });
    }

    const shippable = (order.items || []).filter((i) => i.status !== "Cancelled");
    if (!shippable.length) {
      return res.json({ success: false, message: "No shippable items on this order" });
    }

    const isCod = String(order.paymentMethod || "").toUpperCase() === "COD";
    if (!isCod && !order.payment) {
      return res.json({
        success: false,
        message: "Cannot ship — payment not confirmed for this prepaid order",
      });
    }

    // Optional package override from admin before create
    const { weight, length, breadth, height } = req.body || {};
    if (!order.shipping) order.shipping = {};
    if (weight != null) order.shipping.weight = Number(weight);
    if (length != null) order.shipping.length = Number(length);
    if (breadth != null) order.shipping.breadth = Number(breadth);
    if (height != null) order.shipping.height = Number(height);
    order.shipping.chargedFee =
      order.shipping.chargedFee ?? brand.commerce?.deliveryFee ?? 41;

    const user = await userModel.findById(order.userId);
    const provider = getShippingProvider();
    const result = await provider.createShipment(order, {
      userEmail: user?.email,
    });

    order.shipping = {
      ...order.shipping.toObject?.() || order.shipping,
      partner: result.partner || getShippingConfig().partner,
      shiprocketOrderId: result.shiprocketOrderId || null,
      shipmentId: result.shipmentId || null,
      awbCode: result.awbCode || null,
      courierName: result.courierName || null,
      trackingUrl: result.trackingUrl || null,
      status: result.status || "CREATED",
      lastWebhookAt: null,
      labelUrl: result.labelUrl || null,
      pickupScheduled: Boolean(result.pickupScheduled),
      freightCharge: result.freightCharge ?? order.shipping.freightCharge ?? null,
      weight: result.package?.weight ?? order.shipping.weight,
      length: result.package?.length ?? order.shipping.length,
      breadth: result.package?.breadth ?? order.shipping.breadth,
      height: result.package?.height ?? order.shipping.height,
      chargedFee: order.shipping.chargedFee,
    };

    for (const item of order.items) {
      if (item.status !== "Cancelled") item.status = "Shipped";
    }

    await order.save();

    if (user?.email && order.shipping.trackingUrl) {
      try {
        await sendEmail({
          to: user.email,
          subject: brand.email?.shippedSubject || `${brand.name || "Zayn Leathers"} — Your order has been shipped`,
          html: `
            <h2>Hello ${user.firstName || user.name || ""}</h2>
            <p>Great news — your order <b>#${String(order._id).slice(-8)}</b> is on its way.</p>
            <p>
              <b>Courier:</b> ${order.shipping.courierName || "Assigned"}<br/>
              <b>AWB:</b> ${order.shipping.awbCode || "—"}
            </p>
            <p>
              <a href="${order.shipping.trackingUrl}" style="display:inline-block;padding:10px 18px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;">
                Track shipment
              </a>
            </p>
          `,
        });
      } catch (mailErr) {
        console.error("Shipped email failed:", mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: result.warning
        ? `Shipment created, but AWB assign warned: ${result.warning}`
        : "Shipment created successfully",
      shipping: order.shipping,
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    const status =
      error.code === "SHIPPING_DISABLED"
        ? 409
        : error.code === "INVALID_ADDRESS" || error.code === "NO_ITEMS"
          ? 400
          : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create shipment",
    });
  }
};

/** Admin: save package weight/dims before shipping */
export const updatePackage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await loadOrder(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (!order.shipping) order.shipping = {};
    const { weight, length, breadth, height, chargedFee } = req.body || {};
    if (weight != null) order.shipping.weight = Number(weight);
    if (length != null) order.shipping.length = Number(length);
    if (breadth != null) order.shipping.breadth = Number(breadth);
    if (height != null) order.shipping.height = Number(height);
    if (chargedFee != null) order.shipping.chargedFee = Number(chargedFee);

    await order.save();
    return res.json({ success: true, shipping: order.shipping });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/** Admin: generate shipping label PDF URL */
export const generateLabel = async (req, res) => {
  try {
    if (!requireShippingEnabled(res)) return;
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });
    if (!order.shipping?.shipmentId) {
      return res.json({ success: false, message: "No shipment to label — create shipment first" });
    }

    const provider = getShippingProvider();
    const result = await provider.generateLabel({ shipmentId: order.shipping.shipmentId });
    if (result.labelUrl) order.shipping.labelUrl = result.labelUrl;
    await order.save();

    return res.json({
      success: true,
      labelUrl: order.shipping.labelUrl,
      shipping: order.shipping,
    });
  } catch (error) {
    console.error("Generate label error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: schedule courier pickup from manufacturer */
export const requestPickup = async (req, res) => {
  try {
    if (!requireShippingEnabled(res)) return;
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });
    if (!order.shipping?.shipmentId) {
      return res.json({ success: false, message: "No shipment — create shipment first" });
    }

    const provider = getShippingProvider();
    const result = await provider.requestPickup({ shipmentId: order.shipping.shipmentId });
    order.shipping.pickupScheduled = true;
    if (result.pickupStatus) order.shipping.status = String(result.pickupStatus);
    await order.save();

    return res.json({
      success: true,
      message: "Pickup scheduled",
      shipping: order.shipping,
    });
  } catch (error) {
    console.error("Request pickup error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: cancel courier shipment */
export const cancelShipment = async (req, res) => {
  try {
    if (!requireShippingEnabled(res)) return;
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });
    if (!order.shipping?.awbCode && !order.shipping?.shiprocketOrderId) {
      return res.json({ success: false, message: "No shipment to cancel" });
    }

    const provider = getShippingProvider();
    await provider.cancelShipment({
      awbCode: order.shipping.awbCode,
      shiprocketOrderIds: order.shipping.shiprocketOrderId
        ? [order.shipping.shiprocketOrderId]
        : [],
    });

    order.shipping.status = "CANCELLED";
    for (const item of order.items) {
      if (item.status === "Shipped" || item.status === "Packing") {
        item.status = "Packing";
      }
    }
    await order.save();

    return res.json({
      success: true,
      message: "Shipment cancelled with partner",
      shipping: order.shipping,
    });
  } catch (error) {
    console.error("Cancel shipment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Customer: request a return (admin must approve) */
export const requestReturn = async (req, res) => {
  try {
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (!req.isAdmin && req.userId && String(order.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const hasDelivered = (order.items || []).some((i) => i.status === "Delivered");
    if (!hasDelivered) {
      return res.json({
        success: false,
        message: "Return can only be requested after delivery",
      });
    }

    if (order.shipping?.return?.requested && !order.shipping?.return?.awbCode) {
      return res.json({
        success: false,
        message: "Return already requested — waiting for admin approval",
        shipping: order.shipping,
      });
    }
    if (order.shipping?.return?.awbCode || order.shipping?.return?.shipmentId) {
      return res.json({
        success: false,
        message: "Return shipment already created",
        shipping: order.shipping,
      });
    }

    if (!order.shipping) order.shipping = {};
    order.shipping.return = {
      ...(order.shipping.return?.toObject?.() || order.shipping.return || {}),
      requested: true,
      requestedAt: new Date(),
      reason: (req.body?.reason || "").slice(0, 500) || "Customer return request",
    };

    for (const item of order.items) {
      if (item.status === "Delivered") item.status = "ReturnRequested";
    }

    await order.save();

    try {
      const user = await userModel.findById(order.userId);
      if (process.env.ADMIN_EMAIL) {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `Return requested — order #${String(order._id).slice(-8)}`,
          html: `
            <p>Customer ${user?.email || order.userId} requested a return.</p>
            <p>Reason: ${order.shipping.return.reason}</p>
            <p>Approve in Admin → Orders → Approve return.</p>
          `,
        });
      }
    } catch (mailErr) {
      console.error("Return request admin email failed:", mailErr.message);
    }

    return res.json({
      success: true,
      message: "Return requested — we'll confirm shortly",
      shipping: order.shipping,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/**
 * Admin: approve return → create reverse pickup (customer → manufacturer)
 * Optional restock when return is later marked Returned via webhook / refresh.
 */
export const approveReturn = async (req, res) => {
  try {
    if (!requireShippingEnabled(res)) return;
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (!order.shipping?.return?.requested) {
      return res.json({
        success: false,
        message: "Customer has not requested a return yet",
      });
    }
    if (order.shipping.return.awbCode || order.shipping.return.shipmentId) {
      return res.json({
        success: false,
        message: "Return shipment already exists",
        shipping: order.shipping,
      });
    }

    const user = await userModel.findById(order.userId);
    const provider = getShippingProvider();
    const result = await provider.createReturn(order, {
      userEmail: user?.email,
      reason: order.shipping.return.reason,
    });

    order.shipping.return = {
      ...(order.shipping.return.toObject?.() || order.shipping.return),
      approvedAt: new Date(),
      shiprocketOrderId: result.shiprocketOrderId,
      shipmentId: result.shipmentId,
      awbCode: result.awbCode,
      courierName: result.courierName,
      trackingUrl: result.trackingUrl,
      status: result.status,
      freightCharge: result.freightCharge,
    };

    for (const item of order.items) {
      if (["Delivered", "ReturnRequested"].includes(item.status)) {
        item.status = "ReturnInTransit";
      }
    }

    await order.save();

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: brand.email?.returnApprovedSubject || `${brand.name || "Zayn Leathers"} — Return pickup scheduled`,
          html: `
            <h2>Hello ${user.firstName || user.name || ""}</h2>
            <p>Your return for order <b>#${String(order._id).slice(-8)}</b> is approved.</p>
            <p>The courier will pick up from your address and bring it back to us.</p>
            ${
              order.shipping.return.trackingUrl
                ? `<p><a href="${order.shipping.return.trackingUrl}">Track return</a></p>`
                : ""
            }
          `,
        });
      } catch (mailErr) {
        console.error("Return approved email failed:", mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Return shipment created",
      shipping: order.shipping,
    });
  } catch (error) {
    console.error("Approve return error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: mark return received + optional restock */
export const completeReturn = async (req, res) => {
  try {
    const order = await loadOrder(req.params.orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    const restock = req.body?.restock !== false;

    for (const item of order.items) {
      if (["ReturnRequested", "ReturnInTransit", "Returned"].includes(item.status) ||
          item.status === "Delivered") {
        // only touch return-related / delivered
      }
      if (["ReturnRequested", "ReturnInTransit"].includes(item.status)) {
        item.status = "Returned";
        if (restock && item.productId) {
          await productModel.findByIdAndUpdate(item.productId, {
            $inc: { availableQuantity: item.quantity },
          });
        }
      }
    }

    if (order.shipping?.return) {
      order.shipping.return.status = "RETURNED";
    }

    await order.save();
    return res.json({ success: true, message: "Return completed", shipping: order.shipping });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/** Admin / user: refresh tracking summary from partner */
export const trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await loadOrder(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (!req.isAdmin && req.userId) {
      if (String(order.userId) !== String(req.userId)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
    }

    const awb = order.shipping?.awbCode;
    const returnAwb = order.shipping?.return?.awbCode;

    if (!awb && !returnAwb) {
      return res.json({
        success: true,
        shipping: order.shipping || null,
        tracking: { events: [], status: null },
      });
    }

    if (!isShippingEnabled()) {
      return res.json({
        success: true,
        shipping: order.shipping,
        tracking: { manual: true, events: [] },
      });
    }

    const provider = getShippingProvider();
    let tracking = { events: [], status: null };
    let returnTracking = null;

    if (awb) {
      tracking = await provider.trackShipment({ awbCode: awb });
      if (tracking.status) {
        order.shipping.status = String(tracking.status);
        const mapped = mapPartnerStatusToBrand(tracking.status);
        if (mapped) {
          for (const item of order.items) {
            if (["Cancelled", "Delivered", "Returned", "ReturnRequested", "ReturnInTransit"].includes(item.status)) {
              continue;
            }
            item.status = mapped;
          }
          if (mapped === "Delivered" && String(order.paymentMethod).toUpperCase() === "COD") {
            order.payment = true;
          }
        }
      }
    }

    if (returnAwb) {
      returnTracking = await provider.trackShipment({ awbCode: returnAwb });
      if (returnTracking.status) {
        order.shipping.return.status = String(returnTracking.status);
        const mapped = mapPartnerStatusToBrand(returnTracking.status, { isReturn: true });
        if (mapped) {
          for (const item of order.items) {
            if (["ReturnRequested", "ReturnInTransit"].includes(item.status)) {
              item.status = mapped;
            }
          }
          if (mapped === "Returned" && req.body?.restock !== false) {
            // restock only once when refresh sees Returned — guarded by checking previous
          }
        }
      }
    }

    await order.save();

    return res.json({
      success: true,
      shipping: order.shipping,
      tracking,
      returnTracking,
    });
  } catch (error) {
    console.error("Track shipment error:", error);
    return res.json({ success: false, message: error.message });
  }
};

/**
 * Public / checkout: pincode serviceability + optional rates / ETD
 * Query: ?pincode=110001&cod=1&weight=0.5
 */
export const checkServiceability = async (req, res) => {
  try {
    const pincode = req.query.pincode || req.body?.pincode;
    const cod = String(req.query.cod || req.body?.cod || "0") === "1";
    const weight = Number(req.query.weight || req.body?.weight || process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5);

    if (!pincode || String(pincode).replace(/\D/g, "").length !== 6) {
      return res.json({ success: false, message: "Valid 6-digit pincode required" });
    }

    // When partner off, still allow checkout with flat fee
    if (!isShippingEnabled()) {
      return res.json({
        success: true,
        enabled: false,
        serviceable: true,
        estimatedDays: null,
        estimatedRate: null,
        deliveryFee: brand.commerce?.deliveryFee ?? 41,
        dynamicRates: false,
        message: "Shipping partner off — flat delivery fee applies",
      });
    }

    if (!process.env.SHIPROCKET_PICKUP_PINCODE) {
      return res.json({
        success: true,
        enabled: true,
        serviceable: true,
        estimatedDays: null,
        estimatedRate: null,
        deliveryFee: brand.commerce?.deliveryFee ?? 41,
        dynamicRates: false,
        warning: "SHIPROCKET_PICKUP_PINCODE not set — skipping live check",
      });
    }

    const provider = getShippingProvider();
    const result = await provider.checkServiceability({
      deliveryPincode: pincode,
      weight,
      cod,
    });

    const flatFee = brand.commerce?.deliveryFee ?? 41;
    const useDynamic = isDynamicRatesEnabled();
    const deliveryFee = useDynamic && result.estimatedRate != null
      ? Math.ceil(result.estimatedRate)
      : flatFee;

    return res.json({
      success: true,
      enabled: true,
      serviceable: result.serviceable,
      estimatedDays: result.estimatedDays,
      estimatedRate: result.estimatedRate,
      recommended: result.recommended,
      cheapest: result.cheapest,
      couriers: (result.couriers || []).slice(0, 5),
      deliveryFee,
      flatDeliveryFee: flatFee,
      dynamicRates: useDynamic,
    });
  } catch (error) {
    console.error("Serviceability error:", error);
    // Soft-fail so checkout is never blocked by partner outage
    return res.json({
      success: true,
      serviceable: true,
      warning: error.message,
      deliveryFee: brand.commerce?.deliveryFee ?? 41,
      dynamicRates: false,
    });
  }
};

/**
 * Public webhook from Shiprocket.
 */
export const shiprocketWebhook = async (req, res) => {
  try {
    const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expected) {
      const got =
        req.query.token ||
        req.headers["x-shiprocket-token"] ||
        req.headers["x-api-key"];
      if (got !== expected) {
        return res.status(401).json({ success: false, message: "Unauthorized webhook" });
      }
    }

    const body = req.body || {};
    const awb =
      body.awb ||
      body.awb_code ||
      body.awb_code_number ||
      body?.shipment?.awb ||
      null;
    const srOrderId =
      body.sr_order_id ||
      body.order_id ||
      body.shiprocket_order_id ||
      null;
    const channelOrderId =
      body.channel_order_id ||
      body.order_id_channel ||
      (typeof body.order_id === "string" && String(body.order_id).replace(/^RET-/, "").length === 24
        ? String(body.order_id).replace(/^RET-/, "")
        : null);

    const partnerStatus =
      body.current_status ||
      body.shipment_status ||
      body.status ||
      body.current_status_id ||
      "";

    let order = null;
    let isReturnEvent = false;

    if (awb) {
      order = await orderModel.findOne({ "shipping.return.awbCode": String(awb) });
      if (order) isReturnEvent = true;
    }
    if (!order && awb) {
      order = await orderModel.findOne({ "shipping.awbCode": String(awb) });
    }
    if (!order && channelOrderId) {
      order = await orderModel.findById(channelOrderId).catch(() => null);
      if (order && String(body.order_id || "").startsWith("RET-")) isReturnEvent = true;
    }
    if (!order && srOrderId) {
      order = await orderModel.findOne({
        "shipping.return.shiprocketOrderId": String(srOrderId),
      });
      if (order) isReturnEvent = true;
    }
    if (!order && srOrderId) {
      order = await orderModel.findOne({
        "shipping.shiprocketOrderId": String(srOrderId),
      });
    }

    if (!order) {
      return res.json({ success: true, message: "Order not found — ignored" });
    }

    if (!order.shipping) order.shipping = {};

    if (isReturnEvent) {
      if (!order.shipping.return) order.shipping.return = {};
      if (awb) order.shipping.return.awbCode = String(awb);
      if (partnerStatus) order.shipping.return.status = String(partnerStatus);
      if (body.courier_name) order.shipping.return.courierName = String(body.courier_name);
      if (awb && !order.shipping.return.trackingUrl) {
        order.shipping.return.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
      }
    } else {
      if (awb) order.shipping.awbCode = String(awb);
      if (partnerStatus) order.shipping.status = String(partnerStatus);
      if (body.courier_name) order.shipping.courierName = String(body.courier_name);
      if (awb && !order.shipping.trackingUrl) {
        order.shipping.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
      }
    }
    order.shipping.lastWebhookAt = new Date();

    const mapped = mapPartnerStatusToBrand(partnerStatus, { isReturn: isReturnEvent });
    const previousStatuses = order.items.map((i) => i.status);

    if (mapped) {
      for (const item of order.items) {
        if (["Cancelled"].includes(item.status)) continue;
        if (isReturnEvent) {
          if (["ReturnRequested", "ReturnInTransit", "Delivered"].includes(item.status)) {
            item.status = mapped;
          }
        } else {
          if (["Returned", "ReturnRequested", "ReturnInTransit"].includes(item.status)) continue;
          if (item.status === "Delivered" && mapped !== "Delivered") continue;
          item.status = mapped;
        }
      }
      if (mapped === "Delivered" && String(order.paymentMethod).toUpperCase() === "COD") {
        order.payment = true;
      }

      // Partial RTO: keep advance, don't collect balance
      if (mapped === "RTO" && order.paymentMethod === "Partial" && order.paymentDetails) {
        const alreadyFlagged = order.paymentDetails.advanceKeptOnRto;
        order.paymentDetails.advanceKeptOnRto = true;
        if (!alreadyFlagged && order.paymentDetails.advancePaid && !order.paymentDetails.advanceRefunded) {
          try {
            const user = await userModel.findById(order.userId);
            if (user?.email) {
              await sendEmail({
                to: user.email,
                subject: brand.email?.advanceRetainedSubject || "Zayn Leathers — Delivery unsuccessful",
                html: `
                  <h2>Hello ${user.firstName || user.name || ""}</h2>
                  <p>Your order <b>#${String(order._id).slice(-8)}</b> could not be delivered (RTO).</p>
                  <p>As per our policy, the advance of <b>₹${order.paymentDetails.advanceAmount}</b> has been retained to cover logistics.</p>
                  <p>The remaining balance of ₹${order.paymentDetails.balanceAmount} will not be collected.</p>
                `,
              });
            }
          } catch (mailErr) {
            console.error("Webhook RTO email failed:", mailErr.message);
          }
        }
      }

      // Auto-restock when return arrives at manufacturer
      if (mapped === "Returned") {
        for (const item of order.items) {
          if (item.status === "Returned" && !previousStatuses.includes("Returned")) {
            // only restock items that just transitioned — approximate via previous
          }
        }
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          if (item.status === "Returned" && previousStatuses[i] !== "Returned") {
            await productModel.findByIdAndUpdate(item.productId, {
              $inc: { availableQuantity: item.quantity },
            });
          }
        }
      }
    }

    await order.save();

    if (mapped === "Delivered" && !isReturnEvent) {
      await maybeAutoInvoiceAfterDelivery(order._id);
    }

    const became = mapped && !previousStatuses.every((s) => s === mapped);
    if (became && ["OutForDelivery", "Delivered", "ReturnInTransit", "Returned"].includes(mapped)) {
      try {
        const user = await userModel.findById(order.userId);
        if (user?.email) {
          const trackUrl = isReturnEvent
            ? order.shipping.return?.trackingUrl
            : order.shipping.trackingUrl;
          await sendEmail({
            to: user.email,
            subject: `${brand.name || "Zayn Leathers"} — Order update: ${mapped}`,
            html: `
              <h2>Hello ${user.firstName || user.name || ""}</h2>
              <p>Your order <b>#${String(order._id).slice(-8)}</b> is now: <b>${mapped}</b>.</p>
              ${trackUrl ? `<p><a href="${trackUrl}">Track</a></p>` : ""}
            `,
          });
        }
      } catch (mailErr) {
        console.error("Webhook status email failed:", mailErr.message);
      }
    }

    return res.json({ success: true, mapped: mapped || null, isReturnEvent });
  } catch (error) {
    console.error("Shiprocket webhook error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

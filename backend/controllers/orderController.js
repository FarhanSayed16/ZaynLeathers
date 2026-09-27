import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import SiteSettings from "../models/SiteSettings.js";
import { upsertCheckoutAddress } from "../utils/userAddresses.js";
import { persistCart } from "../utils/cartMerge.js";
import razorpay from 'razorpay'
import crypto from "crypto";
import { sendEmail } from "../utils/mailer.js";
import Coupon from "../models/couponModel.js";
import brand from "../../shared/brand.config.js";
import {
  computeAdvanceBreakdown,
  resolvePartialPaymentConfig,
} from "../utils/partialPayment.js";
import {
  buildOrderDateQuery,
  computeOrderStats,
  matchesOrderSearch,
  matchesStatusFilter,
  sortOrders,
} from "../utils/adminOrderFilters.js";
import {
  refundRazorpayPayment,
  isPreShipStatus,
} from "../utils/razorpayRefund.js";
import { maybeAutoInvoiceAfterDelivery } from "../utils/invoicing/issueInvoiceForOrder.js";
import {
  hasStock,
  buildOrderLineFromProduct,
  decrementSizeStock,
  incrementSizeStock,
} from "../utils/productMatrix.js";
import { parseBillingInput } from "../utils/invoicing/invoiceConfig.js";
import {
  buildCustomerOrderEmailHtml,
  sendCustomerOrderEmail,
} from "../utils/orderEmail.js";

function orderMetaFromBody(body) {
  const billing = parseBillingInput(body);
  return {
    billing,
    couponCode: body.couponCode ? String(body.couponCode).toUpperCase() : "",
  };
}

const currency = brand.commerce.currencyCode.toLowerCase();
const deliveryCharge = brand.commerce.deliveryFee;

const isAccessoriesProduct = (product) =>
  product.department === "accessories" ||
  product.category === "accessories" ||
  product.category === "Accessory";

async function validateOrderStock(items) {
  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) continue;
    if (!hasStock(product, item.size, item.quantity)) {
      return {
        ok: false,
        message: `Insufficient stock for ${product.name}${item.size ? ` (${item.size})` : ""}`,
      };
    }
  }
  return { ok: true };
}

async function buildFixedOrderItems(items) {
  const fixedItems = [];
  let hasAccessoriesProduct = false;

  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) continue;

    if (isAccessoriesProduct(product)) {
      hasAccessoriesProduct = true;
    }

    fixedItems.push(
      buildOrderLineFromProduct(product, {
        size: item.size || "",
        quantity: item.quantity,
      })
    );
  }

  return { fixedItems, hasAccessoriesProduct };
}

async function decrementOrderStock(fixedItems) {
  for (const item of fixedItems) {
    await decrementSizeStock(item.productId, item.size, item.quantity);
  }
}

const razorpayEnabled = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

const razorpayInstance = razorpayEnabled
  ? new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;




const generateOrderTable = (items) => {

  const rows = items.map(item => {

    const total = item.price * item.quantity;
    const img = Array.isArray(item.image) ? item.image[0] : item.image;
    const meta = [
      item.color ? `Colour: ${item.color}` : "",
      item.size ? `Size: ${item.size}` : "",
      item.sku ? `SKU: ${item.sku}` : "",
    ].filter(Boolean).join(" · ");

    return `
      <tr style="border-bottom:1px solid #eee;">
        
        <td style="padding:10px;">
          <img src="${img || ""}" width="60" style="border-radius:6px"/>
        </td>

        <td style="padding:10px;">
          <b>${item.name}</b>
          ${meta ? `<br/><small>${meta}</small>` : ""}
        </td>

        <td align="center" style="padding:10px;">
          ${item.quantity}
        </td>

        <td align="right" style="padding:10px;">
          ₹${item.price}
        </td>

        <td align="right" style="padding:10px;font-weight:600;">
          ₹${total}
        </td>

      </tr>
    `;

  }).join("");

  const grandTotal = items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial">

    <thead style="background:#111;color:#fff">

      <tr>
        <th style="padding:12px">Image</th>
        <th align="left" style="padding:12px">Product</th>
        <th align="center" style="padding:12px">Qty</th>
        <th align="right" style="padding:12px">Price</th>
        <th align="right" style="padding:12px">Total</th>
      </tr>

    </thead>

    <tbody>

      ${rows}

      <tr>

        <td colspan="4" align="right" style="padding:14px;font-weight:bold">
          Grand Total
        </td>

        <td align="right" style="padding:14px;font-weight:bold;font-size:16px">
          ₹${grandTotal}
        </td>

      </tr>

    </tbody>

  </table>
  `;
};

const persistCheckoutAddress = async (user, address, saveAddress) => {
  if (saveAddress === false || !user || !address) return;
  try {
    await upsertCheckoutAddress(user, address);
  } catch (err) {
    console.log("Address book save skipped:", err.message);
  }
};

export const placeOrder = async (req, res) => {

  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to place an order." });
    }

    const userId = req.user._id;
    const { items, amount, address, orderFrom, couponCode } = req.body;

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { fixedItems, hasAccessoriesProduct } = await buildFixedOrderItems(items);

    if (!fixedItems.length) {
      return res.json({ success: false, message: "No valid items in order" });
    }

    const siteSettings = await SiteSettings.findOne({ singleton: "default" }).lean();
    if (siteSettings?.codEnabled === false) {
      return res.json({
        success: false,
        message: "Cash on delivery is not available right now",
      });
    }

    const newOrder = new orderModel({
      userId,
      isGuest: false,
      guestEmail: "",
      guestPhone: "",
      items: fixedItems,
      amount,
      address,
      ...orderMetaFromBody(req.body),
      paymentMethod: "COD",
      payment: false,
      orderFrom,
      date: Date.now()
    });

    await newOrder.save();

    await decrementOrderStock(fixedItems);

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $push: { usedBy: userId } }
      );
    }

    const user = await userModel.findById(userId);
    await persistCheckoutAddress(user, address, req.body.saveAddress);
    if (user) await persistCart(user, {});
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const orderTable = generateOrderTable(fixedItems);

    const customerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    const customerEmail = user?.email;
    const customerPhone = address.phone;

    let internalEmails = [process.env.ADMIN_EMAIL];

    if (hasAccessoriesProduct) {
      internalEmails.push(process.env.PARTNER_EMAIL);
    }

    // ================= ADMIN + PARTNER EMAIL =================

    try {
  await sendEmail({
    to: internalEmails,
    subject: brand.email?.newOrderAdminSubject || `New Order Received - ${newOrder._id}`,
    html: `
      <h2>New Order Received</h2>

      <p><b>Order ID:</b> ${newOrder._id}</p>
      <p><b>Payment:</b> COD</p>
      <p><b>Total:</b> ₹${amount}</p>

      <h3>Customer Details</h3>

      <p>
      ${customerName}<br/>
      ${customerEmail || ""}<br/>
      ${customerPhone || address.phone || ""}
      </p>

      <h3>Shipping Address</h3>

      <p>
      ${address.street}<br/>
      ${address.city}, ${address.state}<br/>
      ${address.country} - ${address.zipcode}
      </p>

      <h3>Order Items</h3>

      ${orderTable}
    `
  });
    } catch (err) {
      console.log("Admin Email Error:", err.message);
    }

    // ================= USER EMAIL =================
    if (customerEmail) {
      try {
        const html = await buildCustomerOrderEmailHtml({
          greetingName: address.firstName || customerName,
          introHtml: "<p>Your order has been placed successfully.</p>",
          orderId: newOrder._id,
          orderTable,
        });
        await sendCustomerOrderEmail({
          to: customerEmail,
          subject: brand.email.orderConfirmedSubject,
          html,
        });
      } catch (err) {
        console.log("User Email Error:", err.message);
      }
    }

    return res.json({
      success:true,
      message:"Order placed successfully",
      orderId: newOrder._id,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success:false,
      message:error.message
    });

  }

};

export const placeOrderRazorpay = async (req,res)=>{

  try{

    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: "Online payments are disabled. Use cash on delivery.",
      });
    }

    const { amount } = req.body;

    const options={
      amount: amount*100,
      currency:"INR",
      receipt:"receipt_"+Date.now()
    }

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      success:true,
      order:razorpayOrder
    })

  }catch(error){

    console.log(error)

    res.json({
      success:false,
      message:error.message
    })

  }

}

/**
 * Create Razorpay order for ADVANCE only (partial payment).
 * Body: { amount } = full order total; server computes advance from settings %.
 */
export const placeOrderPartial = async (req, res) => {
  try {
    const config = await resolvePartialPaymentConfig();
    if (!config.enabled) {
      return res.status(409).json({
        success: false,
        message: "Partial payment is disabled. Enable PARTIAL_PAYMENT_ENABLED and activate it in Admin Settings.",
      });
    }

    const orderTotal = Math.round(Number(req.body.amount) || 0);
    if (orderTotal <= 0) {
      return res.json({ success: false, message: "Invalid order amount" });
    }

    const breakdown = computeAdvanceBreakdown(orderTotal, config.percent, config.minAdvance);

    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: "Online payments are disabled. Use cash on delivery.",
      });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: breakdown.advanceAmount * 100,
      currency: "INR",
      receipt: "partial_" + Date.now(),
      notes: {
        type: "partial_advance",
        order_total: String(breakdown.orderTotal),
        advance_percent: String(breakdown.advancePercent),
        advance_amount: String(breakdown.advanceAmount),
        balance_amount: String(breakdown.balanceAmount),
        min_advance_applied: String(breakdown.minAdvanceApplied),
      },
    });

    res.json({
      success: true,
      order: razorpayOrder,
      paymentDetails: breakdown,
      config: {
        percent: config.percent,
        label: config.label,
        policyNotice: config.policyNotice,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const verifyRazorpay = async (req,res)=>{

  try{
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to place an order." });
    }

    const userId = req.user._id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      amount,
      address,
      orderFrom,
      couponCode
    } = req.body;

    const body = razorpay_order_id+"|"+razorpay_payment_id;

    const expectedSignature = crypto
    .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

    if(expectedSignature !== razorpay_signature){

      return res.json({
        success:false,
        message:"Payment verification failed"
      })

    }

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { fixedItems, hasAccessoriesProduct } = await buildFixedOrderItems(items);

    const newOrder = new orderModel({
      userId,
      items:fixedItems,
      amount,
      address,
      ...orderMetaFromBody(req.body),
      paymentMethod:"Razorpay",
      payment:true,
      orderFrom,
      date:Date.now()
    })

    await newOrder.save()

    await decrementOrderStock(fixedItems);

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $push: { usedBy: userId } }
      );
    }

    const user = await userModel.findById(userId);
    await persistCheckoutAddress(user, address, req.body.saveAddress);
    if (user) await persistCart(user, {});

    const orderTable = generateOrderTable(fixedItems);

    let internalEmails=[process.env.ADMIN_EMAIL];

    if(hasAccessoriesProduct){
      internalEmails.push(process.env.PARTNER_EMAIL);
    }

    // ================= ADMIN EMAIL =================

   try {
  await sendEmail({
    to: internalEmails,
    subject: brand.email?.newPaidOrderAdminSubject || `New Paid Order - ${newOrder._id}`,
    html: `
      <h2>Payment Successful</h2>

      <p><b>Order ID:</b> ${newOrder._id}</p>
      <p><b>Total:</b> ₹${amount}</p>
      <p><b>Payment:</b> Razorpay</p>

      <h3>Customer Details</h3>

      <p>
      ${user.firstName} ${user.lastName}<br/>
      ${user.email}<br/>
      ${address.phone}
      </p>

      <h3>Shipping Address</h3>

      <p>
      ${address.street}<br/>
      ${address.city}, ${address.state}<br/>
      ${address.country} - ${address.zipcode}
      </p>

      <h3>Order Items</h3>

      ${orderTable}
    `
  });
} catch (err) {
  console.log("Payment Admin Email Error:", err.message);
}

    // ================= USER EMAIL =================

  try {
  const html = await buildCustomerOrderEmailHtml({
    greetingName: user.firstName,
    introHtml: "<p>Your payment has been received and your order is confirmed.</p>",
    orderId: newOrder._id,
    orderTable,
  });
  await sendCustomerOrderEmail({
    to: user.email,
    subject: brand.email.paymentSuccessSubject,
    html,
  });
} catch (err) {
  console.log("User Email Error:", err.message);
}

    await userModel.findByIdAndUpdate(userId,{cartData:{}})

    res.json({
      success:true,
      message:"Payment successful & order placed",
      orderId: newOrder._id,
    })

  }catch(error){

    console.log(error)

    res.json({
      success:false,
      message:error.message
    })

  }

}



const enrichOrdersWithType = async (orders) => {
  const productIdsToCheck = new Set();
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (
        item.department !== "accessories" &&
        item.category !== "accessories" &&
        item.category !== "Accessory"
      ) {
        productIdsToCheck.add(item.productId?.toString());
      }
    });
  });

  const validProductIds = Array.from(productIdsToCheck).filter(Boolean);
  const products = await productModel
    .find({ _id: { $in: validProductIds } })
    .select("_id category department");

  const productAccessoriesMap = new Map();
  products.forEach((p) => {
    productAccessoriesMap.set(p._id.toString(), p.department || p.category);
  });

  return orders.map((order) => {
    const doc = order._doc ? { ...order._doc } : { ...order };
    let orderType = brand.catalog.primary.label;

    for (const item of doc.items || []) {
      if (
        item.department === "accessories" ||
        item.category === "accessories" ||
        item.category === "Accessory"
      ) {
        orderType = brand.catalog.secondary.label;
        break;
      }

      const fallbackAccessory = productAccessoriesMap.get(item.productId?.toString());
      if (fallbackAccessory === "accessories" || fallbackAccessory === "Accessory") {
        orderType = brand.catalog.secondary.label;
        break;
      }
    }

    return { ...doc, orderType };
  });
};

const allOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "All",
      q = "",
      sortOrder = "newest",
      dateFrom,
      dateTo,
      exportAll = false,
    } = req.body || {};

    const mongoQuery = {};
    const dateRange = buildOrderDateQuery(dateFrom, dateTo);
    if (dateRange) mongoQuery.date = dateRange;

    const rawOrders = await orderModel.find(mongoQuery).sort({ createdAt: -1 }).lean();
    let orders = await enrichOrdersWithType(rawOrders);

    orders = orders
      .filter((order) => matchesStatusFilter(order, status))
      .filter((order) => matchesOrderSearch(order, q));
    orders = sortOrders(orders, sortOrder);

    const statsOrders = await orderModel.find({}).select("items payment paymentMethod paymentDetails").lean();
    const stats = computeOrderStats(statsOrders);

    const total = orders.length;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = exportAll
      ? total
      : Math.min(100, Math.max(1, Number(limit) || 10));
    const totalPages = exportAll ? 1 : Math.max(1, Math.ceil(total / limitNum));
    const start = exportAll ? 0 : (pageNum - 1) * limitNum;
    const paginated = exportAll ? orders : orders.slice(start, start + limitNum);

    res.json({
      success: true,
      orders: paginated,
      pagination: {
        page: exportAll ? 1 : pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
      stats,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.user._id })   // ✅ user from JWT
      .sort({ createdAt: -1 });         // ✅ works now

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

const orderDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await orderModel.find({ userId });
    res.json({ success: true, response });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, itemId, status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    // ❌ ADMIN cannot touch user-cancelled item
    if (item.status === "Cancelled" && item.cancelledBy === "USER") {
      return res.json({
        success: false,
        message: "User cancelled this item. Admin cannot update it."
      });
    }

    // ✅ Update status
    await orderModel.updateOne(
      { _id: orderId },
      { $set: { "items.$[elem].status": status } },
      { arrayFilters: [{ "elem._id": itemId }] }
    );

    item.status = status;
    
    // Auto mark as paid for COD when delivered
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.payment = true;
    }

    // Partial: retain advance flag on RTO + notify customer
    if (status === "RTO" && order.paymentMethod === "Partial" && order.paymentDetails) {
      order.paymentDetails.advanceKeptOnRto = true;
      try {
        const user = await userModel.findById(order.userId);
        if (user?.email && order.paymentDetails.advancePaid && !order.paymentDetails.advanceRefunded) {
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
        console.log("RTO advance email error:", mailErr.message);
      }
    }

    await order.save();

    if (status === "Delivered") {
      await maybeAutoInvoiceAfterDelivery(orderId);
    }

    res.json({ success: true, message: "Status Updated" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, itemId, size } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const item = order.items.find(
      i => i._id.toString() === itemId && i.size === size
    );

    if (!item) {
      return res.json({ success: false, message: "Item not found in order" });
    }

    if (["Delivered", "Cancelled"].includes(item.status)) {
      return res.json({
        success: false,
        message: `Cannot cancel ${item.status} item`
      });
    }

    const statusBeforeCancel = item.status;
    const wasPreShip = isPreShipStatus(statusBeforeCancel);

    // ✅ Restock if not delivered or already cancelled
    if (!["Delivered", "Cancelled"].includes(item.status)) {
      await incrementSizeStock(item.productId, item.size, item.quantity);
    }

    // ✅ Cancel item
    const cancelledBy = req.isAdmin ? "ADMIN" : "USER";
    item.status = "Cancelled";
    item.cancelledBy = cancelledBy;

    // Pre-ship: if entire order is now cancelled, refund Partial advance
    let refundInfo = null;
    const allCancelled = order.items.every((i) => i.status === "Cancelled");
    const hadProgressedItem = order.items.some(
      (i) => i.status !== "Cancelled" && !isPreShipStatus(i.status)
    );
    // If a courier shipment was already created, do not auto-refund
    const hadShipment = Boolean(
      order.shipping?.shipmentId || order.shipping?.awbCode
    );
    const eligibleForAdvanceRefund =
      order.paymentMethod === "Partial" &&
      order.paymentDetails?.advancePaid &&
      !order.paymentDetails?.advanceRefunded &&
      order.paymentDetails?.advancePaymentId &&
      allCancelled &&
      wasPreShip &&
      !hadProgressedItem &&
      !hadShipment;

    if (eligibleForAdvanceRefund) {
      try {
        const refund = await refundRazorpayPayment(
          order.paymentDetails.advancePaymentId,
          order.paymentDetails.advanceAmount
        );
        order.paymentDetails.advanceRefunded = true;
        order.paymentDetails.advanceRefundId = refund?.id || null;
        order.paymentDetails.advanceRefundedAt = new Date();
        order.paymentDetails.advanceRefundAmount = order.paymentDetails.advanceAmount;
        refundInfo = {
          refunded: true,
          amount: order.paymentDetails.advanceAmount,
          refundId: order.paymentDetails.advanceRefundId,
        };

        try {
          const user = await userModel.findById(order.userId);
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: brand.email?.advanceRefundedSubject || "Zayn Leathers — Advance refunded",
              html: `
                <h2>Hello ${user.firstName || user.name || ""}</h2>
                <p>Your order <b>#${String(order._id).slice(-8)}</b> was cancelled before shipping.</p>
                <p>Your advance of <b>₹${order.paymentDetails.advanceAmount}</b> has been refunded to the original payment method.</p>
              `,
            });
          }
        } catch (mailErr) {
          console.log("Advance refund email error:", mailErr.message);
        }
      } catch (refundErr) {
        console.error("Advance refund failed:", refundErr.message);
        refundInfo = {
          refunded: false,
          error: refundErr.message,
        };
      }
    }

    await order.save();

    res.json({
      success: true,
      message: refundInfo?.refunded
        ? "Item cancelled — advance refunded"
        : "Item cancelled successfully",
      refund: refundInfo,
    });

  } catch (error) {
    console.log("Cancel Order Error:", error);
    res.json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Admin: exception refund of partial advance (e.g. goodwill after RTO).
 */
export const refundAdvance = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    if (order.paymentMethod !== "Partial" || !order.paymentDetails?.advancePaid) {
      return res.json({ success: false, message: "No partial advance to refund" });
    }
    if (order.paymentDetails.advanceRefunded) {
      return res.json({
        success: true,
        message: "Advance already refunded",
        paymentDetails: order.paymentDetails,
      });
    }
    if (!order.paymentDetails.advancePaymentId) {
      return res.json({ success: false, message: "Missing Razorpay payment id" });
    }

    const refund = await refundRazorpayPayment(
      order.paymentDetails.advancePaymentId,
      order.paymentDetails.advanceAmount
    );

    order.paymentDetails.advanceRefunded = true;
    order.paymentDetails.advanceRefundId = refund?.id || null;
    order.paymentDetails.advanceRefundedAt = new Date();
    order.paymentDetails.advanceRefundAmount = order.paymentDetails.advanceAmount;
    order.paymentDetails.advanceKeptOnRto = false;
    await order.save();

    try {
      const user = await userModel.findById(order.userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: brand.email?.advanceRefundedSubject || "Zayn Leathers — Advance refunded",
          html: `
            <h2>Hello ${user.firstName || user.name || ""}</h2>
            <p>We've refunded your advance of <b>₹${order.paymentDetails.advanceAmount}</b> for order <b>#${String(order._id).slice(-8)}</b>.</p>
            ${reason ? `<p>Note: ${reason}</p>` : ""}
          `,
        });
      }
    } catch (mailErr) {
      console.log("Admin advance refund email error:", mailErr.message);
    }

    res.json({
      success: true,
      message: "Advance refunded",
      paymentDetails: order.paymentDetails,
    });
  } catch (error) {
    console.error("refundAdvance error:", error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderStripe = async (req,res)=>{
  res.json({ success: false, message: "Stripe payment not implemented yet" });
};

const dashboardStats = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const totalProducts = await productModel.countDocuments();
    const totalUsers = await userModel.countDocuments();

    const [orderStats] = await orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          codCount: { $sum: { $cond: [{ $eq: ["$paymentMethod", "COD"] }, 1, 0] } },
          razorpayCount: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Razorpay"] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Partial"] }, 1, 0] } },
          partialBalanceDue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentMethod", "Partial"] },
                    { $eq: ["$paymentDetails.advancePaid", true] },
                    { $ne: ["$paymentDetails.balancePaid", true] },
                    { $ne: ["$paymentDetails.advanceRefunded", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        }
      }
    ]);

    const [itemStats] = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          apparelRevenue: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    ["men", "women", "Tote", "Bundle"],
                  ],
                },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
          bagsRevenue: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    "bags",
                  ],
                },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
          accessoriesRevenue: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    ["accessories", "Accessory"],
                  ],
                },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
          apparelOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    ["men", "women", "Tote", "Bundle"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          bagsOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    "bags",
                  ],
                },
                1,
                0,
              ],
            },
          },
          accessoriesOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $ifNull: ["$items.department", "$items.category"] },
                    ["accessories", "Accessory"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          statusOrderPlaced: { $sum: { $cond: [{ $eq: ["$items.status", "OrderPlaced"] }, 1, 0] } },
          statusPacking: { $sum: { $cond: [{ $eq: ["$items.status", "Packing"] }, 1, 0] } },
          statusShipped: { $sum: { $cond: [{ $eq: ["$items.status", "Shipped"] }, 1, 0] } },
          statusOutForDelivery: { $sum: { $cond: [{ $eq: ["$items.status", "OutForDelivery"] }, 1, 0] } },
          statusDelivered: { $sum: { $cond: [{ $eq: ["$items.status", "Delivered"] }, 1, 0] } },
          statusCancelled: { $sum: { $cond: [{ $eq: ["$items.status", "Cancelled"] }, 1, 0] } }
        }
      }
    ]);

    const recentOrders = await orderModel.find({}).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: orderStats?.totalRevenue || 0
      },
      revenue: {
        toteRevenue: itemStats?.apparelRevenue || 0,
        apparelRevenue: itemStats?.apparelRevenue || 0,
        bagsRevenue: itemStats?.bagsRevenue || 0,
        accessoriesRevenue: itemStats?.accessoriesRevenue || 0
      },
      ordersOverview: {
        toteOrders: itemStats?.apparelOrders || 0,
        apparelOrders: itemStats?.apparelOrders || 0,
        bagsOrders: itemStats?.bagsOrders || 0,
        accessoriesOrders: itemStats?.accessoriesOrders || 0
      },
      paymentMethods: {
        COD: orderStats?.codCount || 0,
        Razorpay: orderStats?.razorpayCount || 0,
        Partial: orderStats?.partialCount || 0,
        PartialBalanceDue: orderStats?.partialBalanceDue || 0,
      },
      statusStats: {
        OrderPlaced: itemStats?.statusOrderPlaced || 0,
        Packing: itemStats?.statusPacking || 0,
        Shipped: itemStats?.statusShipped || 0,
        OutForDelivery: itemStats?.statusOutForDelivery || 0,
        Delivered: itemStats?.statusDelivered || 0,
        Cancelled: itemStats?.statusCancelled || 0
      },
      recentOrders
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Verify partial advance payment and create order.
 * Remaining balance is due on delivery.
 */
export const verifyPartial = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({
        success: false,
        message: "Please login as a customer to place an order.",
      });
    }

    const config = await resolvePartialPaymentConfig();
    if (!config.enabled) {
      return res.status(409).json({
        success: false,
        message: "Partial payment is disabled",
      });
    }

    const userId = req.user._id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      amount,
      address,
      orderFrom,
      couponCode,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const orderTotal = Math.round(Number(amount) || 0);
    const breakdown = computeAdvanceBreakdown(orderTotal, config.percent, config.minAdvance);

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { fixedItems, hasAccessoriesProduct } = await buildFixedOrderItems(items);

    if (!fixedItems.length) {
      return res.json({ success: false, message: "No valid items in order" });
    }

    const newOrder = new orderModel({
      userId,
      items: fixedItems,
      amount: breakdown.orderTotal,
      address,
      ...orderMetaFromBody(req.body),
      paymentMethod: "Partial",
      payment: false,
      paymentDetails: {
        currency: "INR",
        orderTotal: breakdown.orderTotal,
        advancePercent: breakdown.advancePercent,
        advanceAmount: breakdown.advanceAmount,
        balanceAmount: breakdown.balanceAmount,
        advancePaid: true,
        balancePaid: breakdown.balanceAmount === 0,
        advancePaymentId: razorpay_payment_id,
        advanceOrderId: razorpay_order_id,
        balanceCollectedAt: breakdown.balanceAmount === 0 ? new Date() : null,
        balanceCollectedBy: breakdown.balanceAmount === 0 ? "AUTO" : null,
        advanceKeptOnRto: false,
        advanceRefunded: false,
        advanceRefundId: null,
        advanceRefundedAt: null,
        advanceRefundAmount: null,
      },
      orderFrom,
      date: Date.now(),
    });

    if (breakdown.balanceAmount === 0) {
      newOrder.payment = true;
    }

    await newOrder.save();

    await decrementOrderStock(fixedItems);

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $push: { usedBy: userId } }
      );
    }

    const user = await userModel.findById(userId);
    await persistCheckoutAddress(user, address, req.body.saveAddress);
    if (user) await persistCart(user, {});
    const orderTable = generateOrderTable(fixedItems);
    const internalEmails = [process.env.ADMIN_EMAIL];
    if (hasAccessoriesProduct) internalEmails.push(process.env.PARTNER_EMAIL);

    try {
      await sendEmail({
        to: internalEmails.filter(Boolean),
        subject: brand.email?.partialAdvanceAdminSubject || `Partial advance paid — ${newOrder._id}`,
        html: `
          <h2>Partial payment order</h2>
          <p><b>Order ID:</b> ${newOrder._id}</p>
          <p><b>Total:</b> ₹${breakdown.orderTotal}</p>
          <p><b>Advance (${breakdown.advancePercent}%):</b> ₹${breakdown.advanceAmount} — PAID</p>
          <p><b>Balance on delivery:</b> ₹${breakdown.balanceAmount}</p>
          ${orderTable}
        `,
      });
    } catch (err) {
      console.log("Partial admin email error:", err.message);
    }

    try {
      if (user?.email) {
        const html = await buildCustomerOrderEmailHtml({
          greetingName: user.firstName || user.name || "",
          introHtml: `
            <p>We received your advance of <b>₹${breakdown.advanceAmount}</b> (${breakdown.advancePercent}%).</p>
            <p>Order total: ₹${breakdown.orderTotal}<br/>
            Balance due on delivery: <b>₹${breakdown.balanceAmount}</b></p>
          `,
          orderId: newOrder._id,
          orderTable,
          extraHtml: `<p style="font-size:12px;color:#666;">${config.policyNotice}</p>`,
        });
        await sendCustomerOrderEmail({
          to: user.email,
          subject: brand.email?.partialAdvanceSubject || "Zayn Leathers — Advance payment received",
          html,
        });
      }
    } catch (err) {
      console.log("Partial user email error:", err.message);
    }

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({
      success: true,
      message: "Advance paid — order placed",
      orderId: newOrder._id,
      paymentDetails: newOrder.paymentDetails,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Admin: mark remaining balance as collected (on delivery).
 */
export const collectBalance = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    if (order.paymentMethod !== "Partial") {
      return res.json({
        success: false,
        message: "This order is not a partial payment order",
      });
    }
    if (!order.paymentDetails) {
      return res.json({ success: false, message: "Missing payment details" });
    }
    if (order.paymentDetails.balancePaid || order.payment) {
      return res.json({
        success: true,
        message: "Balance already collected",
        order,
      });
    }

    order.paymentDetails.balancePaid = true;
    order.paymentDetails.balanceCollectedAt = new Date();
    order.paymentDetails.balanceCollectedBy = "ADMIN";
    order.payment = true;
    await order.save();

    try {
      const user = await userModel.findById(order.userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: brand.email?.balanceCollectedSubject || "Zayn Leathers — Order fully paid",
          html: `
            <h2>Hello ${user.firstName || user.name || ""}</h2>
            <p>Your remaining balance of <b>₹${order.paymentDetails.balanceAmount}</b> has been recorded as paid.</p>
            <p>Order <b>#${String(order._id).slice(-8)}</b> is now fully paid. Thank you!</p>
          `,
        });
      }
    } catch (err) {
      console.log("Balance collected email error:", err.message);
    }

    res.json({
      success: true,
      message: "Balance marked as collected",
      order,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getAdminOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer." });
    }
    const order = await orderModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {placeOrderStripe,allOrders,userOrders,orderDetails,getOrderById,getAdminOrderById,updateStatus,cancelOrder,dashboardStats}
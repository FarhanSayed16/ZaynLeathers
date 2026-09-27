import razorpay from "razorpay";

let instance = null;

function getRazorpay() {
  if (instance) return instance;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Razorpay keys missing — cannot refund");
    err.code = "RAZORPAY_CONFIG";
    throw err;
  }
  instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return instance;
}

/**
 * Refund a Razorpay payment (amount in INR rupees).
 * Pass amount=null to refund full payment.
 */
export async function refundRazorpayPayment(paymentId, amountRupees = null) {
  if (!paymentId) {
    const err = new Error("Missing Razorpay payment id for refund");
    err.code = "NO_PAYMENT_ID";
    throw err;
  }

  const rzp = getRazorpay();
  const payload = {};
  if (amountRupees != null) {
    const paise = Math.round(Number(amountRupees) * 100);
    if (paise > 0) payload.amount = paise;
  }

  const refund = await rzp.payments.refund(paymentId, payload);
  return refund;
}

export const POST_SHIP_STATUSES = [
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "RTO",
  "ReturnRequested",
  "ReturnInTransit",
  "Returned",
];

export function isPreShipStatus(status) {
  return !POST_SHIP_STATUSES.includes(status);
}

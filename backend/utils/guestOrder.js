import validator from "validator";
import orderModel from "../models/orderModel.js";

export const normalizeGuestEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const normalizeGuestPhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(0, 10);

export function validateGuestCheckout(address = {}) {
  const guestEmail = normalizeGuestEmail(address.email);
  const guestPhone = normalizeGuestPhone(address.phone);

  if (!guestEmail || !validator.isEmail(guestEmail)) {
    return { ok: false, message: "Valid email is required for guest checkout" };
  }
  if (guestPhone.length !== 10) {
    return { ok: false, message: "Valid 10-digit phone number is required" };
  }
  if (!String(address.firstName || "").trim() || !String(address.lastName || "").trim()) {
    return { ok: false, message: "First and last name are required" };
  }
  if (!String(address.street || "").trim() || !String(address.city || "").trim()) {
    return { ok: false, message: "Please complete your delivery address" };
  }
  if (!String(address.state || "").trim() || !String(address.zipcode || "").trim()) {
    return { ok: false, message: "State and pincode are required" };
  }

  return { ok: true, guestEmail, guestPhone };
}

export async function linkGuestOrdersToUser(userId, email) {
  const guestEmail = normalizeGuestEmail(email);
  if (!userId || !guestEmail) return { linked: 0 };

  const result = await orderModel.updateMany(
    { isGuest: true, guestEmail, userId: null },
    { $set: { userId, isGuest: false } }
  );

  return { linked: result.modifiedCount || 0 };
}

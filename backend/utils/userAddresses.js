export const MAX_ADDRESSES = 5;

export function normalizeAddress(input = {}) {
  return {
    label: String(input.label || "Home").trim().slice(0, 40) || "Home",
    firstName: String(input.firstName || "").trim(),
    lastName: String(input.lastName || "").trim(),
    phone: String(input.phone || "").replace(/\D/g, "").slice(0, 15),
    email: String(input.email || "").trim().toLowerCase(),
    street: String(input.street || "").trim(),
    apartment: String(input.apartment || "").trim(),
    city: String(input.city || "").trim(),
    state: String(input.state || "").trim(),
    zipcode: String(input.zipcode || "").replace(/\s/g, "").slice(0, 10),
    country: String(input.country || "India").trim() || "India",
    isDefault: Boolean(input.isDefault),
  };
}

export function validateAddress(addr) {
  if (!addr.firstName || !addr.lastName) return "Name is required";
  if (!addr.street) return "Street address is required";
  if (!addr.city) return "City is required";
  if (!addr.state) return "State is required";
  if (!addr.zipcode || addr.zipcode.length < 5) return "Valid pincode is required";
  if (!addr.phone || addr.phone.length < 10) return "Valid phone is required";
  return null;
}

function clearDefaults(user) {
  (user.addresses || []).forEach((row) => {
    row.isDefault = false;
  });
}

export async function upsertCheckoutAddress(user, address) {
  if (!user || !address?.street || !address?.zipcode) return;

  const incoming = normalizeAddress({ ...address, isDefault: true });
  const error = validateAddress(incoming);
  if (error) return;

  if (!Array.isArray(user.addresses)) user.addresses = [];

  const key = `${incoming.street}|${incoming.zipcode}`.toLowerCase();
  const existing = user.addresses.find(
    (row) => `${row.street}|${row.zipcode}`.toLowerCase() === key
  );

  if (existing) {
    Object.assign(existing, { ...incoming, label: existing.label || incoming.label });
    clearDefaults(user);
    existing.isDefault = true;
  } else if (user.addresses.length < MAX_ADDRESSES) {
    clearDefaults(user);
    user.addresses.push(incoming);
  } else {
    const target = user.addresses.find((row) => row.isDefault) || user.addresses[0];
    Object.assign(target, { ...incoming, label: target.label || incoming.label });
    clearDefaults(user);
    target.isDefault = true;
  }

  await user.save();
}

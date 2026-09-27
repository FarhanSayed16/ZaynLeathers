export const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const emptyAddress = {
  label: "Home",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  apartment: "",
  city: "",
  state: "Maharashtra",
  zipcode: "",
  country: "India",
  isDefault: false,
};

export function addressToForm(addr = {}, fallback = {}) {
  return {
    label: addr.label || "Home",
    firstName: addr.firstName || fallback.firstName || "",
    lastName: addr.lastName || fallback.lastName || "",
    email: addr.email || fallback.email || "",
    phone: addr.phone || fallback.phone || "",
    street: addr.street || "",
    apartment: addr.apartment || "",
    city: addr.city || "",
    state: addr.state || "Maharashtra",
    zipcode: addr.zipcode || "",
    country: addr.country || "India",
  };
}

export function formatAddressLine(addr) {
  if (!addr) return "";
  return [addr.street, addr.apartment, addr.city, addr.state, addr.zipcode, addr.country]
    .filter(Boolean)
    .join(", ");
}

export function isAuthFailure(payload, status) {
  if (status === 401) return true;
  const msg = String(payload?.message || "").toLowerCase();
  return (
    msg.includes("not authorized") ||
    msg.includes("expired token") ||
    msg.includes("invalid token") ||
    msg.includes("invalid or expired")
  );
}

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

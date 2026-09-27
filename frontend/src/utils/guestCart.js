const GUEST_CART_KEY = "zayn_guest_cart";

export function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeGuestCart(cart) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart || {}));
  } catch {
    /* ignore quota */
  }
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function cartHasItems(cart) {
  if (!cart || typeof cart !== "object") return false;
  for (const productId of Object.keys(cart)) {
    const sizes = cart[productId];
    if (!sizes || typeof sizes !== "object") continue;
    for (const size of Object.keys(sizes)) {
      if (Number(sizes[size]) > 0) return true;
    }
  }
  return false;
}

export function bumpCart(cart, itemId, size) {
  const next = structuredClone(cart || {});
  if (!next[itemId]) next[itemId] = {};
  next[itemId][size] = (Number(next[itemId][size]) || 0) + 1;
  return next;
}

export function setCartQty(cart, itemId, size, quantity) {
  const next = structuredClone(cart || {});
  if (!next[itemId]) next[itemId] = {};
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    delete next[itemId][size];
    if (!Object.keys(next[itemId]).length) delete next[itemId];
  } else {
    next[itemId][size] = qty;
  }
  return next;
}

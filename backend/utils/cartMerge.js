export function mergeCartObjects(serverCart = {}, guestCart = {}) {
  const out = {};
  const sources = [serverCart, guestCart];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const productId of Object.keys(source)) {
      const sizes = source[productId];
      if (!sizes || typeof sizes !== "object") continue;
      if (!out[productId]) out[productId] = {};
      for (const size of Object.keys(sizes)) {
        const qty = Number(sizes[size]) || 0;
        if (qty <= 0) continue;
        out[productId][size] = (Number(out[productId][size]) || 0) + qty;
      }
    }
  }

  return out;
}

export async function persistCart(user, cartData) {
  user.cartData = cartData || {};
  user.markModified("cartData");
  await user.save();
}

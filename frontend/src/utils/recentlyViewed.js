const KEY = "zayn_recently_viewed";
const MAX = 8;

export function readRecentlyViewed() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(productId) {
  if (!productId) return;
  const next = [String(productId), ...readRecentlyViewed().filter((id) => id !== String(productId))].slice(
    0,
    MAX
  );
  localStorage.setItem(KEY, JSON.stringify(next));
}

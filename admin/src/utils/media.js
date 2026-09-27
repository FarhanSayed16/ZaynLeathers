export function cloudinaryUrl(url, { width, height, crop = "fill", quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return url || "";
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  if (/\/upload\/(?:[^/]+,)*[fcqw]_/.test(url) || url.includes("/upload/f_auto")) {
    return url;
  }
  const parts = ["f_auto", `q_${quality}`];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  if (width || height) parts.push(`c_${crop}`);
  return `${url.slice(0, idx + marker.length)}${parts.join(",")}/${url.slice(idx + marker.length)}`;
}

export function adminThumb(url) {
  return cloudinaryUrl(url, { width: 200, height: 200, crop: "fill" });
}

export function adminPreview(url) {
  return cloudinaryUrl(url, { width: 900, height: 1100, crop: "limit" });
}

export function imageSrc(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.url || value.secure_url || value.src || "";
}

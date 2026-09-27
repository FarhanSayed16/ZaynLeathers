/**
 * Optimize Cloudinary delivery URLs with transforms.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryUrl(url, { width, height, crop = 'fill', quality = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url || '';

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  // Already transformed
  if (/\/upload\/(?:[^/]+,)*[fcqw]_/.test(url) || url.includes('/upload/f_auto')) {
    return url;
  }

  const parts = ['f_auto', `q_${quality}`];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  if (width || height) parts.push(`c_${crop}`);
  parts.push('dpr_auto');

  return `${url.slice(0, idx + marker.length)}${parts.join(',')}/${url.slice(idx + marker.length)}`;
}

export function productThumb(url) {
  return cloudinaryUrl(url, { width: 480, height: 560, crop: 'fill' });
}

export function productGallery(url) {
  return cloudinaryUrl(url, { width: 900, height: 1100, crop: 'limit' });
}

export function heroImage(url) {
  return cloudinaryUrl(url, { width: 1600, height: 900, crop: 'fill' });
}

export function tileImage(url) {
  return cloudinaryUrl(url, { width: 800, height: 500, crop: 'fill' });
}

export function igImage(url) {
  return cloudinaryUrl(url, { width: 400, height: 400, crop: 'fill' });
}

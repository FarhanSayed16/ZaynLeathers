/** Server-side style picker — keep in sync with frontend/src/utils/styleListing.js */
export function pickPrimaryVariant(variants) {
  if (!variants?.length) return null;
  const active = variants.filter((v) => v.isActive !== false);
  const pool = active.length ? active : variants;
  return (
    pool.find((v) => v.isPrimaryListing) ||
    pool.find((v) => v.featured) ||
    pool.find((v) => v.bestseller) ||
    pool[0]
  );
}

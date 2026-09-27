export function groupProductsByStyle(products) {
  const map = new Map();

  for (const product of products) {
    const key = product.parentId || product._id;
    if (!map.has(key)) {
      map.set(key, {
        parentId: key,
        secondaryName: product.secondaryName || product.name,
        department: product.department,
        variants: [],
      });
    }
    const group = map.get(key);
    group.variants.push(product);
    if (product.secondaryName) group.secondaryName = product.secondaryName;
  }

  return Array.from(map.values())
    .map((group) => {
      const activeCount = group.variants.filter((v) => v.isActive !== false).length;
      const totalQty = group.variants.reduce(
        (sum, v) => sum + (Number(v.availableQuantity) || 0),
        0
      );
      const allHidden = activeCount === 0;
      return { ...group, activeCount, totalQty, allHidden };
    })
    .sort((a, b) => (b.variants[0]?.date || 0) - (a.variants[0]?.date || 0));
}

export function matrixSummary(product) {
  if (Array.isArray(product.sizeMatrix) && product.sizeMatrix.length) {
    return product.sizeMatrix
      .map((row) => `${row.size}: ${row.qty} @ ₹${row.price}`)
      .join(" · ");
  }
  return `${product.availableQuantity ?? 0} total @ ₹${product.price ?? 0}`;
}

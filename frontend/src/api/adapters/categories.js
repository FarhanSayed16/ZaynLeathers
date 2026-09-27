/**
 * ============================================================
 * Categories Adapter — WooCommerce ↔ Frontend
 * ============================================================
 * Maps WooCommerce product categories to the flat list and
 * tree structure your frontend expects.
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";

/**
 * Map a WooCommerce category → frontend category shape.
 */
function mapCategory(wc) {
  return {
    _id: String(wc.id),
    name: wc.name || "",
    slug: wc.slug || "",
    description: wc.description || "",
    image: wc.image?.src || "",
    parent: wc.parent ? String(wc.parent) : null,
    count: wc.count || 0,
    menuOrder: wc.menu_order || 0,
  };
}

/**
 * Fetch all categories from WooCommerce.
 */
export async function fetchCategories() {
  const url = wcUrl("products/categories", {
    per_page: 100,
    hide_empty: false,
    orderby: "menu_order",
    order: "asc",
  });

  const cats = await request(url);
  return cats.map(mapCategory);
}

/**
 * Build a tree structure from flat categories.
 * Returns { categories: [...flat], tree: [...nested] }.
 *
 * Tree shape matches what your frontend ShopContext expects.
 */
export async function fetchCategoryTree() {
  const flat = await fetchCategories();

  // Build tree
  const byId = {};
  flat.forEach((cat) => {
    byId[cat._id] = { ...cat, children: [] };
  });

  const tree = [];
  flat.forEach((cat) => {
    if (cat.parent && byId[cat.parent]) {
      byId[cat.parent].children.push(byId[cat._id]);
    } else {
      tree.push(byId[cat._id]);
    }
  });

  // Sort by menuOrder
  tree.sort((a, b) => a.menuOrder - b.menuOrder);
  tree.forEach((node) =>
    node.children.sort((a, b) => a.menuOrder - b.menuOrder)
  );

  return {
    categories: flat,
    tree,
  };
}

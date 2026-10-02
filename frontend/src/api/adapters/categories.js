/**
 * ============================================================
 * Categories Adapter — WooCommerce ↔ Frontend
 * ============================================================
 */

import { wcUrl, request } from "../wooClient.js";
import { canonicalizeSlug, departmentCanonicals } from "../../utils/categoryMap.js";

function mapCategory(wc) {
  const slug = wc.slug || "";
  const isTopLevel = !wc.parent;
  const canonical = canonicalizeSlug(slug);
  const isDepartment =
    isTopLevel || departmentCanonicals().includes(canonical);

  return {
    _id: String(wc.id),
    name: wc.name || "",
    slug,
    description: wc.description || "",
    image: wc.image?.src || "",
    parent: wc.parent ? String(wc.parent) : null,
    count: wc.count || 0,
    menuOrder: wc.menu_order || 0,
    // Used by Navbar / Shop to treat top-level Woo cats as departments
    type: isDepartment && isTopLevel ? "department" : "category",
  };
}

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

export async function fetchCategoryTree() {
  const flat = await fetchCategories();

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

  tree.sort((a, b) => a.menuOrder - b.menuOrder);
  tree.forEach((node) =>
    node.children.sort((a, b) => a.menuOrder - b.menuOrder)
  );

  return {
    categories: flat,
    tree,
  };
}

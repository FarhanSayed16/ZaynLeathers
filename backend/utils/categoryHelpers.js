/**
 * Shared category helpers
 */

export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildCategoryTree(flat = []) {
  const byId = new Map();
  flat.forEach((c) => {
    byId.set(String(c._id), {
      ...c,
      _id: c._id,
      children: [],
    });
  });

  const roots = [];
  byId.forEach((node) => {
    const parentKey = node.parentId ? String(node.parentId) : null;
    if (parentKey && byId.has(parentKey)) {
      byId.get(parentKey).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursive = (nodes) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRecursive(n.children || []));
  };
  sortRecursive(roots);
  return roots;
}

/** Find root department slug for a category node */
export function resolveDepartmentSlug(node, byId) {
  let current = node;
  const guard = new Set();
  while (current) {
    if (current.type === "department") return current.slug;
    const pid = current.parentId ? String(current.parentId) : null;
    if (!pid || guard.has(pid)) break;
    guard.add(pid);
    current = byId.get(pid);
  }
  return node?.slug || "";
}

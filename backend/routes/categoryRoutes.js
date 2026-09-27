import express from "express";
import Category from "../models/Category.js";
import adminAuth from "../middleware/adminAuth.js";
import { slugify, buildCategoryTree } from "../utils/categoryHelpers.js";

const router = express.Router();

async function wouldCreateCycle(categoryId, newParentId) {
  if (!newParentId) return false;
  if (String(categoryId) === String(newParentId)) return true;
  let current = await Category.findById(newParentId).select("parentId");
  const guard = new Set([String(categoryId)]);
  while (current) {
    const id = String(current._id);
    if (guard.has(id)) return true;
    guard.add(id);
    if (!current.parentId) break;
    current = await Category.findById(current.parentId).select("parentId");
  }
  return false;
}

async function computePath(parentId, slug) {
  if (!parentId) return slug;
  const parent = await Category.findById(parentId).select("path slug");
  if (!parent) return slug;
  const base = parent.path || parent.slug;
  return `${base}/${slug}`;
}

/** Public flat list (active only) */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Public tree (active nav nodes only) */
router.get("/tree", async (req, res) => {
  try {
    if (req.query.admin === "1") {
      return res.status(403).json({
        success: false,
        message: "Use GET /api/categories/admin with admin auth for the full tree",
      });
    }
    const filter = { isActive: true, showInNav: true };
    const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
    const tree = buildCategoryTree(categories);
    res.json({ success: true, tree, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin", adminAuth, async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();
    const tree = buildCategoryTree(categories);
    res.json({ success: true, categories, tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      parentId,
      gender,
      image,
      order,
      showInNav,
      showInShop,
      slug: rawSlug,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const nodeType = type || (parentId ? "category" : "department");
    if (!["department", "group", "category"].includes(nodeType)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    let parent = null;
    if (parentId) {
      parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(400).json({ success: false, message: "Parent not found" });
      }
    }

    let slug = slugify(rawSlug || name);
    if (parent) {
      // Prefer unique path-based slug when name repeats across departments
      const candidate = `${parent.slug}-${slug}`;
      const taken = await Category.findOne({ slug: candidate });
      const baseTaken = await Category.findOne({ slug });
      slug = baseTaken && !taken ? candidate : baseTaken ? candidate : slug;
      if (await Category.findOne({ slug })) {
        slug = `${candidate}-${Date.now().toString(36)}`;
      }
    } else {
      const exists = await Category.findOne({ slug });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Category with this slug already exists",
        });
      }
    }

    const path = await computePath(parentId || null, slug);

    const category = new Category({
      name: name.trim(),
      slug,
      type: nodeType,
      parentId: parentId || null,
      path,
      gender: gender || null,
      image: image || "",
      order: Number(order) || 0,
      showInNav: showInNav !== false && showInNav !== "false",
      showInShop: showInShop !== false && showInShop !== "false",
    });
    await category.save();

    res.json({ success: true, message: "Category added", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      parentId,
      gender,
      image,
      order,
      isActive,
      showInNav,
      showInShop,
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (parentId !== undefined) {
      const nextParent = parentId || null;
      if (await wouldCreateCycle(category._id, nextParent)) {
        return res.status(400).json({ success: false, message: "Invalid parent (cycle)" });
      }
      category.parentId = nextParent;
    }

    if (name) {
      category.name = name.trim();
    }
    if (type && ["department", "group", "category"].includes(type)) {
      category.type = type;
    }
    if (gender !== undefined) category.gender = gender || null;
    if (image !== undefined) category.image = image;
    if (order !== undefined) category.order = Number(order) || 0;
    if (isActive !== undefined) category.isActive = isActive;
    if (showInNav !== undefined) category.showInNav = showInNav;
    if (showInShop !== undefined) category.showInShop = showInShop;

    category.path = await computePath(category.parentId, category.slug);
    await category.save();
    res.json({ success: true, message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/toggle", adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    category.isActive = !category.isActive;
    await category.save();
    res.json({
      success: true,
      message: `Category ${category.isActive ? "Enabled" : "Disabled"}`,
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const childCount = await Category.countDocuments({ parentId: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Delete or move child categories first",
      });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

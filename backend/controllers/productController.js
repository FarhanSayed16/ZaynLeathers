import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import productModel from "../models/productModel.js";
import Category from "../models/Category.js";
import brand from "../../shared/brand.config.js";
import { resolveDepartmentSlug } from "../utils/categoryHelpers.js";
import { readAdminToken } from "../middleware/adminAuth.js";
import {
  generateParentId,
  validateColor,
  parseSizeMatrixInput,
  applyLegacyFromMatrix,
  validateSizeMatrix,
  syncSecondaryNameAcrossSiblings,
  syncRecommendedAcrossSiblings,
  ensureSizeMatrix,
} from "../utils/productMatrix.js";
import {
  runCatalogAudit,
  applyCatalogFix,
  applyAllCatalogFixes,
} from "../utils/catalogAudit.js";
import { scanLowStock, getLowStockThreshold } from "../utils/lowStock.js";

const cloudinaryFolder = () =>
  process.env.CLOUDINARY_FOLDER ||
  brand.commerce?.cloudinaryFolder ||
  brand.id ||
  "products";

function peekAdmin(req) {
  try {
    const token = readAdminToken(req);
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map((t) => t.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map(String).map((t) => t.trim()).filter(Boolean);
  } catch {
    /* comma-separated */
  }
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

const parseBool = (v) => v === true || v === "true" || v === "1";

const parseRecommendedIds = (raw) => {
  if (raw == null || raw === "") return [];
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(",");
    }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(String).filter(Boolean))].slice(0, 8);
};

const uploadOne = async (item) => {
  if (!item) return null;
  const folder = `${cloudinaryFolder()}/products`;
  const base64Image = `data:${item.mimetype};base64,${item.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64Image, {
    resource_type: "image",
    folder,
  });
  return result.secure_url;
};

const uploadImages = async (files = []) => {
  const list = files.filter(Boolean);
  return Promise.all(list.map(uploadOne));
};

const mergeImageSlots = async (fileSlots = [], existing = []) => {
  const next = [...existing];
  for (let i = 0; i < fileSlots.length; i++) {
    if (fileSlots[i]) {
      next[i] = await uploadOne(fileSlots[i]);
    }
  }
  return next.filter(Boolean);
};

/** Resolve department + leaf metadata from categoryId or legacy department slug */
async function resolveCatalogFields({ categoryId, department, category, subCategory, gender }) {
  if (categoryId) {
    const leaf = await Category.findById(categoryId);
    if (!leaf) {
      throw new Error("Category not found");
    }
    const all = await Category.find({}).select("_id parentId type slug name").lean();
    const byId = new Map(all.map((c) => [String(c._id), c]));
    const deptSlug = resolveDepartmentSlug(leaf, byId) || department || leaf.slug;
    return {
      department: deptSlug,
      categoryId: leaf._id,
      categorySlug: leaf.slug,
      category: leaf.name,
      subCategory: subCategory === "NotSelected" ? "" : subCategory || leaf.name,
      gender: gender || leaf.gender || "",
    };
  }

  if (!department && !category) {
    throw new Error("department or categoryId is required");
  }

  return {
    department: department || category,
    categoryId: undefined,
    categorySlug: category || department,
    category: category || department,
    subCategory: subCategory === "NotSelected" ? "" : subCategory || "",
    gender: gender || "",
  };
}

const addProduct = async (req, res) => {
  try {
    const {
      name,
      secondaryName,
      description,
      price,
      oldPrice,
      discount,
      category,
      categoryId,
      department,
      subCategory,
      gender,
      material,
      dimensions,
      availableQuantity,
      sizes,
      bestseller,
      featured,
      tags,
      color,
      parentId,
      sizeMatrix,
      status,
      sku,
      seoTitle,
      imageAlt,
      hsnSac,
      gstRate,
      recommendedProductIds,
    } = req.body;

    let catalog;
    try {
      catalog = await resolveCatalogFields({
        categoryId,
        department,
        category,
        subCategory,
        gender,
      });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    const imageSlots = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => req.files?.[`image${n}`]?.[0]);
    const imagesUrl = await uploadImages(imageSlots);

    if (!imagesUrl.length) {
      return res.json({ success: false, message: "At least one product image is required" });
    }

    const sizeimage1 = req.files?.sizeimage1?.[0];
    const sizeimage2 = req.files?.sizeimage2?.[0];
    const sizeimagesUrl = await uploadImages([sizeimage1, sizeimage2]);

    let parsedSizes = ["One Size"];
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes) || !parsedSizes.length) parsedSizes = ["One Size"];
    } catch {
      parsedSizes = ["One Size"];
    }

    const colorCheck = validateColor(color);
    if (!colorCheck.ok) {
      return res.json({ success: false, message: colorCheck.message });
    }

    let matrix;
    try {
      matrix = parseSizeMatrixInput(sizeMatrix, {
        sizes: parsedSizes,
        price,
        oldPrice,
        qty: availableQuantity,
      });
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    const matrixCheck = validateSizeMatrix(matrix);
    if (!matrixCheck.ok) {
      return res.json({ success: false, message: matrixCheck.message });
    }

    const legacy = applyLegacyFromMatrix(matrix);
    const styleId = parentId ? String(parentId).trim() : generateParentId();

    const duplicateColour = await productModel.findOne({
      parentId: styleId,
      color: colorCheck.color,
    });
    if (duplicateColour) {
      return res.json({
        success: false,
        message: `Colour "${colorCheck.color}" already exists for this style. Edit the existing variant or pick another colour.`,
      });
    }

    const product = new productModel({
      name,
      secondaryName,
      description,
      parentId: styleId,
      price: legacy.price,
      oldPrice: legacy.oldPrice,
      discount: discount ? Number(discount) : undefined,
      department: catalog.department,
      categoryId: catalog.categoryId,
      categorySlug: catalog.categorySlug,
      category: catalog.category,
      subCategory: catalog.subCategory,
      gender: catalog.gender || "",
      material,
      dimensions,
      availableQuantity: legacy.availableQuantity,
      sizes: legacy.sizes,
      sizeMatrix: matrix,
      bestseller: parseBool(bestseller),
      featured: parseBool(featured),
      tags: parseTags(tags),
      color: colorCheck.color,
      sku: sku || "",
      seoTitle: seoTitle || "",
      imageAlt: imageAlt || "",
      hsnSac: hsnSac || "",
      gstRate: gstRate !== undefined && gstRate !== "" ? Number(gstRate) : null,
      recommendedProductIds: parseRecommendedIds(recommendedProductIds),
      image: imagesUrl,
      viewsizeimage: sizeimagesUrl,
      date: Date.now(),
      status: status || "",
    });

    await product.save();
    await syncSecondaryNameAcrossSiblings(styleId, secondaryName);
    res.json({ success: true, message: "Product Added", product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getVariants = async (req, res) => {
  try {
    const { parentId } = req.params;
    const filter = { parentId: String(parentId) };
    if (!peekAdmin(req)) {
      filter.isActive = { $ne: false };
    }
    const products = await productModel
      .find(filter)
      .select("_id name color image parentId secondaryName isActive")
      .sort({ color: 1 });
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const listProduct = async (req, res) => {
  try {
    const {
      page,
      limit,
      category,
      department,
      categorySlug,
      gender,
      tag,
      bestseller,
      featured,
      search,
    } = req.query;

    const filter = {};
    if (!peekAdmin(req)) {
      filter.isActive = { $ne: false };
    }
    if (department) filter.department = department;
    if (categorySlug) filter.categorySlug = categorySlug;
    if (gender) filter.gender = gender;
    if (tag) filter.tags = tag;
    // Legacy: ?category=Tote|Accessory → treat as department if matches known, else leaf name
    if (category && category !== "All") {
      if (["men", "women", "bags", "accessories", "home-living", "collections", "custom-made", "sale"].includes(category)) {
        filter.department = category;
      } else if (["Tote", "Accessory", "Bundle"].includes(category)) {
        // old enum no longer used — ignore / map loosely
        if (category === "Accessory") filter.department = "accessories";
        else filter.department = { $in: ["men", "women"] };
      } else {
        filter.$or = [
          ...(filter.$or || []),
          { category },
          { categorySlug: category },
          { subCategory: category },
        ];
      }
    }
    if (bestseller === "true") filter.bestseller = true;
    if (featured === "true") filter.featured = true;
    if (search) {
      const q = String(search).trim();
      const searchOr = [
        { name: { $regex: q, $options: "i" } },
        { secondaryName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
      filter.$and = [...(filter.$and || []), { $or: searchOr }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 0);
    const limitNum = Math.max(0, parseInt(limit, 10) || 0);

    const total = await productModel.countDocuments(filter);
    let query = productModel.find(filter).sort({ date: -1 });

    if (pageNum && limitNum) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const products = await query;
    res.json({
      success: true,
      products,
      total,
      page: pageNum || 1,
      limit: limitNum || total,
      pages: limitNum ? Math.ceil(total / limitNum) : 1,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/** Public GET by id */
const getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    if (product.isActive === false && !peekAdmin(req)) {
      return res.json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      secondaryName,
      description,
      price,
      oldPrice,
      discount,
      category,
      categoryId,
      department,
      subCategory,
      gender,
      material,
      dimensions,
      availableQuantity,
      sizes,
      bestseller,
      featured,
      tags,
      color,
      parentId,
      sizeMatrix,
      status,
      sku,
      seoTitle,
      imageAlt,
      hsnSac,
      gstRate,
      recommendedProductIds,
    } = req.body;

    const existing = await productModel.findById(productId);
    if (!existing) {
      return res.json({ success: false, message: "Product not found" });
    }

    let catalog = null;
    if (categoryId || department || category) {
      try {
        catalog = await resolveCatalogFields({
          categoryId: categoryId || existing.categoryId,
          department: department || existing.department,
          category: category || existing.category,
          subCategory,
          gender: gender !== undefined ? gender : existing.gender,
        });
      } catch (err) {
        return res.json({ success: false, message: err.message });
      }
    }

    const imageSlots = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => req.files?.[`image${n}`]?.[0]);
    const mergedImages = await mergeImageSlots(imageSlots, existing.image || []);

    const sizeimage1 = req.files?.sizeimage1?.[0];
    const sizeimage2 = req.files?.sizeimage2?.[0];
    const mergedSizeImages = await mergeImageSlots(
      [sizeimage1, sizeimage2],
      existing.viewsizeimage || []
    );

    let parsedSizes = existing.sizes;
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes) || !parsedSizes.length) parsedSizes = existing.sizes;
      } catch {
        /* keep existing */
      }
    }

    const nextColor = color !== undefined ? color : existing.color;
    const colorCheck = validateColor(nextColor);
    if (!colorCheck.ok) {
      return res.json({ success: false, message: colorCheck.message });
    }

    let matrix;
    try {
      matrix = parseSizeMatrixInput(sizeMatrix, {
        sizes: parsedSizes,
        price: price !== undefined ? price : existing.price,
        oldPrice: oldPrice !== undefined ? oldPrice : existing.oldPrice,
        qty: availableQuantity !== undefined ? availableQuantity : existing.availableQuantity,
      });
      if (!sizeMatrix && existing.sizeMatrix?.length) {
        matrix = ensureSizeMatrix(existing);
      }
    } catch (err) {
      return res.json({ success: false, message: err.message });
    }

    const matrixCheck = validateSizeMatrix(matrix);
    if (!matrixCheck.ok) {
      return res.json({ success: false, message: matrixCheck.message });
    }

    const legacy = applyLegacyFromMatrix(matrix);
    const styleId = parentId ? String(parentId).trim() : existing.parentId;
    const nextSecondaryName = secondaryName ?? existing.secondaryName;

    const productData = {
      name: name ?? existing.name,
      secondaryName: nextSecondaryName,
      description: description ?? existing.description,
      parentId: styleId,
      price: legacy.price,
      oldPrice: legacy.oldPrice,
      discount: discount !== undefined && discount !== "" ? Number(discount) : existing.discount,
      department: catalog?.department || existing.department,
      categoryId: catalog?.categoryId || existing.categoryId,
      categorySlug: catalog?.categorySlug || existing.categorySlug,
      category: catalog?.category || category || existing.category,
      subCategory:
        catalog?.subCategory !== undefined
          ? catalog.subCategory
          : subCategory === "NotSelected"
            ? ""
            : subCategory !== undefined
              ? subCategory
              : existing.subCategory,
      gender: catalog?.gender !== undefined ? catalog.gender : existing.gender || "",
      material: material ?? existing.material,
      dimensions: dimensions ?? existing.dimensions,
      availableQuantity: legacy.availableQuantity,
      sizes: legacy.sizes,
      sizeMatrix: matrix,
      bestseller:
        bestseller !== undefined ? parseBool(bestseller) : existing.bestseller,
      featured:
        featured !== undefined ? parseBool(featured) : existing.featured,
      tags: tags !== undefined ? parseTags(tags) : existing.tags,
      color: colorCheck.color,
      sku: sku !== undefined ? sku : existing.sku,
      seoTitle: seoTitle !== undefined ? seoTitle : existing.seoTitle,
      imageAlt: imageAlt !== undefined ? imageAlt : existing.imageAlt,
      hsnSac: hsnSac !== undefined ? hsnSac : existing.hsnSac || "",
      gstRate:
        gstRate !== undefined && gstRate !== ""
          ? Number(gstRate)
          : existing.gstRate ?? null,
      recommendedProductIds:
        recommendedProductIds !== undefined
          ? parseRecommendedIds(recommendedProductIds)
          : existing.recommendedProductIds || [],
      image: mergedImages.length ? mergedImages : existing.image,
      viewsizeimage: mergedSizeImages.length ? mergedSizeImages : existing.viewsizeimage,
      status: status !== undefined ? status : existing.status,
    };

    await productModel.findByIdAndUpdate(productId, productData, { returnDocument: "after" });
    await syncSecondaryNameAcrossSiblings(styleId, nextSecondaryName, productId);
    if (recommendedProductIds !== undefined) {
      await syncRecommendedAcrossSiblings(styleId, productData.recommendedProductIds, productId);
    }
    res.json({ success: true, message: "Update Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const setProductActive = async (req, res) => {
  try {
    const { id, isActive } = req.body;
    const product = await productModel.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    res.json({
      success: true,
      message: product.isActive ? "Product visible in shop" : "Product hidden from shop",
      product,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const setProductStock = async (req, res) => {
  try {
    const { id, availableQuantity, sizeMatrix } = req.body;
    const product = await productModel.findById(id);
    if (!product) return res.json({ success: false, message: "Product not found" });

    if (sizeMatrix) {
      let matrix;
      try {
        matrix = parseSizeMatrixInput(sizeMatrix, {
          sizes: product.sizes,
          price: product.price,
          oldPrice: product.oldPrice,
          qty: product.availableQuantity,
        });
      } catch (err) {
        return res.json({ success: false, message: err.message });
      }
      const legacy = applyLegacyFromMatrix(matrix);
      product.sizeMatrix = matrix;
      product.availableQuantity = legacy.availableQuantity;
      product.price = legacy.price;
      product.oldPrice = legacy.oldPrice;
      product.sizes = legacy.sizes;
    } else if (availableQuantity !== undefined) {
      const matrix = ensureSizeMatrix(product);
      if (matrix.length === 1) {
        matrix[0].qty = Number(availableQuantity);
      }
      const legacy = applyLegacyFromMatrix(matrix);
      product.sizeMatrix = matrix;
      product.availableQuantity = legacy.availableQuantity;
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const duplicateProduct = async (req, res) => {
  try {
    const { id } = req.body;
    const existing = await productModel.findById(id).lean();
    if (!existing) return res.json({ success: false, message: "Product not found" });
    delete existing._id;
    const copy = await productModel.create({
      ...existing,
      name: `${existing.name} (copy)`,
      sku: existing.sku
        ? `${existing.sku}-COPY-${Date.now().toString(36).slice(-5)}`
        : "",
      isActive: false,
      isPrimaryListing: false,
      date: Date.now(),
      parentId: generateParentId(),
    });
    res.json({ success: true, message: "Duplicate created (hidden until you unhide)", product: copy });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Admin: template for adding a new colour to an existing style */
const getStyleTemplate = async (req, res) => {
  try {
    const { parentId } = req.params;
    const variants = await productModel.find({ parentId: String(parentId) }).sort({ date: 1 });
    if (!variants.length) {
      return res.json({ success: false, message: "Style not found" });
    }

    const source =
      variants.find((v) => v.isPrimaryListing && v.isActive !== false) ||
      variants.find((v) => v.isActive !== false) ||
      variants[0];

    res.json({
      success: true,
      template: {
        parentId: source.parentId,
        secondaryName: source.secondaryName,
        description: source.description,
        categoryId: source.categoryId,
        department: source.department,
        category: source.category,
        categorySlug: source.categorySlug,
        subCategory: source.subCategory,
        gender: source.gender,
        material: source.material,
        dimensions: source.dimensions,
        sizes: source.sizes,
        sizeMatrix: ensureSizeMatrix(source),
        discount: source.discount,
        tags: source.tags,
        viewsizeimage: source.viewsizeimage,
        usedColors: variants.map((v) => v.color).filter(Boolean),
        variantCount: variants.length,
      },
      variants: variants.map((v) => ({
        _id: v._id,
        color: v.color,
        name: v.name,
        isActive: v.isActive !== false,
        sku: v.sku,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Admin: hide or show all colour variants in a style */
const setStyleActive = async (req, res) => {
  try {
    const { parentId, isActive } = req.body;
    if (!parentId) {
      return res.json({ success: false, message: "parentId is required" });
    }
    const result = await productModel.updateMany(
      { parentId: String(parentId) },
      { isActive: Boolean(isActive) }
    );
    if (!result.matchedCount) {
      return res.json({ success: false, message: "Style not found" });
    }
    res.json({
      success: true,
      message: isActive ? "Style visible in shop" : "Style hidden from shop",
      updated: result.modifiedCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Admin: set one colour as primary shop listing for a style */
const setPrimaryListing = async (req, res) => {
  try {
    const { id } = req.body;
    const product = await productModel.findById(id);
    if (!product) return res.json({ success: false, message: "Product not found" });

    await productModel.updateMany(
      { parentId: product.parentId },
      { isPrimaryListing: false }
    );
    product.isPrimaryListing = true;
    await product.save();

    res.json({ success: true, message: "Primary listing colour updated", product });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Admin: audit catalogue for variant/matrix issues */
const catalogAudit = async (req, res) => {
  try {
    const data = await runCatalogAudit();
    res.json({ success: true, ...data });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** Admin: apply one fix or all fixable issues */
const catalogFix = async (req, res) => {
  try {
    const { fix, fixAll } = req.body;

    if (fixAll) {
      const { issues } = await runCatalogAudit();
      const results = await applyAllCatalogFixes(issues);
      return res.json({
        success: true,
        message: `Applied ${results.filter((r) => r.ok).length} fix(es)`,
        results,
      });
    }

    if (!fix) {
      return res.json({ success: false, message: "fix or fixAll is required" });
    }

    const result = await applyCatalogFix(fix);
    if (!result.ok) {
      return res.json({ success: false, message: result.message });
    }

    res.json({ success: true, message: "Fix applied", result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold != null
      ? Number(req.query.threshold)
      : getLowStockThreshold();
    const limit = req.query.limit != null ? Number(req.query.limit) : 20;
    const data = await scanLowStock({ threshold, limit });
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export {
  listProduct,
  addProduct,
  removeProduct,
  singleProduct,
  editProduct,
  getProductById,
  setProductActive,
  setProductStock,
  duplicateProduct,
  getStyleTemplate,
  setStyleActive,
  setPrimaryListing,
  catalogAudit,
  catalogFix,
};

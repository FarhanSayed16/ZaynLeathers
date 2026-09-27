import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  secondaryName: { type: String, required: true },
  parentId: { type: String, required: true, index: true },
  description: { type: String, required: true },

  price: { type: Number, required: true },
  oldPrice: { type: Number },
  discount: { type: Number },

  image: { type: Array, required: true },
  viewsizeimage: { type: Array, required: false, default: [] },

  /**
   * Department slug: men | women | bags | accessories | home-living | collections | custom-made | sale
   * Also stored on order line items for analytics.
   */
  department: { type: String, required: true, index: true },

  /** Leaf category reference + denormalized slug/name */
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    index: true,
  },
  categorySlug: { type: String, index: true },
  /** Display / legacy field — leaf category name (or department if unset) */
  category: { type: String, required: true, index: true },
  subCategory: { type: String, index: true },

  gender: {
    type: String,
    enum: ["men", "women", "unisex", ""],
    default: "",
    index: true,
  },

  material: { type: String },
  dimensions: { type: String },

  availableQuantity: { type: Number, required: true },
  sizes: { type: Array, required: true, default: ["One Size"] },
  /** Per-size price and stock (source of truth when present) */
  sizeMatrix: {
    type: [
      {
        size: { type: String, required: true },
        price: { type: Number, required: true, default: 0 },
        oldPrice: { type: Number },
        qty: { type: Number, required: true, default: 0 },
      },
    ],
    default: [],
  },

  bestseller: { type: Boolean, default: false, index: true },
  featured: { type: Boolean, default: false, index: true },
  tags: { type: [String], default: [] },

  color: { type: String, required: true },
  sku: { type: String, default: "", index: true },
  hsnSac: { type: String, default: "" },
  gstRate: { type: Number, default: null },
  seoTitle: { type: String, default: "" },
  imageAlt: { type: String, default: "" },
  date: { type: Number, required: true },
  status: { type: String, default: "" },
  isActive: { type: Boolean, default: true, index: true },
  /** Preferred colour for shop card when multiple variants exist */
  /** Admin-pinned “you may also like” — auto-fill fills remaining slots */
  recommendedProductIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
    default: [],
  },
});

productSchema.index({ department: 1, categorySlug: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ parentId: 1, color: 1 });

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;

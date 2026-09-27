import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    /** department | group | category */
    type: {
      type: String,
      enum: ["department", "group", "category"],
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    /** URL/filter path e.g. men/leather-jackets */
    path: { type: String, default: "", index: true },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", null],
      default: null,
    },
    image: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    showInNav: { type: Boolean, default: true },
    showInShop: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1, order: 1 });

export default mongoose.model("Category", categorySchema);

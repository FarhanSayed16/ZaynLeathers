import mongoose from "mongoose";

const instagramPromoSchema = new mongoose.Schema(
  {
    /** Optional — if empty, storefront shows a branded placeholder */
    image: { type: String, default: "" },
    instagramLink: { type: String, required: true },
    caption: { type: String },
    productLink: { type: String },
    sequence: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("InstagramPromo", instagramPromoSchema);

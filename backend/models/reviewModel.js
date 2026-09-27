import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "product", // assuming you have a product model
      index: true
    },
    name: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    isHidden: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;

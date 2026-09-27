import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    video: {
      type: String,
      required: true,
    },
    title: String,
    description: String,
    outfit: String,
  },
  { timestamps: true }
);

export default mongoose.model("VideoReview", reviewSchema);
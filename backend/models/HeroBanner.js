import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  title: String,
  subtitle: String,
  ctaLabel: String,
  ctaLink: String,

  sequence: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true,
    unique: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("HeroBanner", heroBannerSchema);
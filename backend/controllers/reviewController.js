import reviewModel from "../models/reviewModel.js";

// Get all reviews for a specific product
export const getReviews = async (req, res) => {
  try {
    const productId = req.params.productId;
    const reviews = await reviewModel
      .find({ productId, isHidden: { $ne: true } })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Get all reviews across all products (admin only — route is protected)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("productId", "name image");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Add a new review (signed-in customers only)
export const addReview = async (req, res) => {
  try {
    if (req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admins cannot post storefront reviews from this endpoint",
      });
    }

    if (!req.userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "Sign in to leave a review",
      });
    }

    const { productId, comment, rating } = req.body;
    const parsedRating = Number(rating);

    if (!productId || !comment?.trim()) {
      return res.status(400).json({ success: false, error: "Product and comment are required" });
    }
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, error: "Rating must be between 1 and 5" });
    }

    const name =
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
      req.user.email ||
      "Customer";

    const newReview = new reviewModel({
      productId,
      name,
      comment: comment.trim(),
      rating: parsedRating,
      userId: req.userId,
    });
    await newReview.save();

    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { isHidden } = req.body;
    const review = await reviewModel.findByIdAndUpdate(
      req.params.id,
      { isHidden: Boolean(isHidden) },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await reviewModel.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

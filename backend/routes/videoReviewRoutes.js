import express from "express";
import { uploadReview, getReviews } from "../controllers/videoReviewController.js";
import upload from "../middleware/upload.js"; // ✅ USE THIS
import VideoReview from "../models/VideoReview.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 👉 Routes
router.post("/upload", adminAuth, upload.single("video"), uploadReview);
router.get("/", getReviews);

// 👉 DELETE REVIEW
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await VideoReview.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Review deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
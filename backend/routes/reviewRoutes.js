import express from "express";
import rateLimit from "express-rate-limit";
import {
  getReviews,
  addReview,
  getAllReviews,
  moderateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const reviewRouter = express.Router();

const reviewPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many reviews from this IP. Try again later." },
});

reviewRouter.get("/admin", adminAuth, getAllReviews);
reviewRouter.patch("/mod/:id", adminAuth, moderateReview);
reviewRouter.delete("/mod/:id", adminAuth, deleteReview);
reviewRouter.get("/:productId", getReviews);
reviewRouter.post("/", reviewPostLimiter, authUser, addReview);

export default reviewRouter;

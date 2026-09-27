import express from "express";
import {
  createCoupon,
  validateCoupon,
  getAllCoupons,
  getActiveCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
 
const router = express.Router();
 
router.post("/", adminAuth, createCoupon);
router.get("/validate/:code", authUser, validateCoupon);
router.get("/active", getActiveCoupons);
router.get("/", adminAuth, getAllCoupons);
router.patch("/:id", adminAuth, updateCoupon);
router.delete("/:id", adminAuth, deleteCoupon);
 
export default router;
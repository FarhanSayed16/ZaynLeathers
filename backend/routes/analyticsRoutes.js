import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import cronOrAdminAuth from "../middleware/cronOrAdminAuth.js";
import { requireFeature } from "../middleware/requireFeature.js";
import {
  exportCustomers,
  exportOrders,
  exportProducts,
  getCoupons,
  getDigestSettings,
  getProducts,
  getSummary,
  putDigestSettings,
  runDigest,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.post(
  "/digest/run",
  requireFeature("analyticsPro"),
  cronOrAdminAuth,
  runDigest
);

router.use(requireFeature("analyticsPro"));
router.use(adminAuth);

router.get("/digest/settings", getDigestSettings);
router.put("/digest/settings", putDigestSettings);
router.get("/summary", getSummary);
router.get("/products", getProducts);
router.get("/coupons", getCoupons);
router.get("/export/orders", exportOrders);
router.get("/export/products", exportProducts);
router.get("/export/customers", exportCustomers);

export default router;

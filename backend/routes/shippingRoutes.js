import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import {
  getConfig,
  createShipment,
  updatePackage,
  generateLabel,
  requestPickup,
  cancelShipment,
  trackShipment,
  requestReturn,
  approveReturn,
  completeReturn,
  checkServiceability,
  shiprocketWebhook,
} from "../controllers/shippingController.js";

const shippingRouter = express.Router();

// Public
shippingRouter.get("/config", getConfig);
shippingRouter.get("/serviceability", checkServiceability);
shippingRouter.post("/serviceability", checkServiceability);

// Shiprocket → Afiya Leathers
shippingRouter.post("/shiprocket/webhook", shiprocketWebhook);

// Admin ops
shippingRouter.post("/shiprocket/create/:orderId", adminAuth, createShipment);
shippingRouter.patch("/shiprocket/package/:orderId", adminAuth, updatePackage);
shippingRouter.post("/shiprocket/label/:orderId", adminAuth, generateLabel);
shippingRouter.post("/shiprocket/pickup/:orderId", adminAuth, requestPickup);
shippingRouter.post("/shiprocket/cancel/:orderId", adminAuth, cancelShipment);
shippingRouter.post("/shiprocket/return/approve/:orderId", adminAuth, approveReturn);
shippingRouter.post("/shiprocket/return/complete/:orderId", adminAuth, completeReturn);
shippingRouter.get("/shiprocket/track/:orderId", adminAuth, trackShipment);

// Customer
shippingRouter.get("/shiprocket/track-user/:orderId", authUser, trackShipment);
shippingRouter.post("/shiprocket/return/request/:orderId", authUser, requestReturn);

export default shippingRouter;

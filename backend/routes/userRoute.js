import express from "express";
import {
  registerUser,
  resendOtp,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getAdminCustomer,
  adminLogin,
  getUserProfile,
  changePassword,
} from "../controllers/userController.js";
import {
  updateProfile,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

import authUser from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const userRouter = express.Router();

const jsonTooMany = {
  success: false,
  message:
    "Too many authentication attempts from this IP. Please try again after 15 minutes.",
};

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonTooMany,
});

/** Stricter for register / resend / forgot (email-sending) */
const sendMailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonTooMany,
});

/** Looser for login + OTP verify (users mistype codes) */
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonTooMany,
});

/* =========================
   AUTH & REGISTRATION
========================= */

userRouter.post("/admin", adminLoginLimiter, adminLogin);

userRouter.post("/register", sendMailLimiter, registerUser);
userRouter.post("/resend-otp", sendMailLimiter, resendOtp);
userRouter.post("/verify-otp", authAttemptLimiter, verifyOtp);
userRouter.post("/login", authAttemptLimiter, loginUser);

/* =========================
   PASSWORD RESET
========================= */

userRouter.post("/forgot-password", sendMailLimiter, forgotPassword);
userRouter.post("/reset-password", authAttemptLimiter, resetPassword);

/* =========================
   USER PROFILE (PROTECTED)
========================= */

userRouter.get("/profile", authUser, getUserProfile);
userRouter.put("/profile", authUser, updateProfile);
userRouter.put("/password", authUser, changePassword);
userRouter.get("/addresses", authUser, listAddresses);
userRouter.post("/addresses", authUser, addAddress);
userRouter.put("/addresses/:id/default", authUser, setDefaultAddress);
userRouter.put("/addresses/:id", authUser, updateAddress);
userRouter.delete("/addresses/:id", authUser, deleteAddress);
userRouter.get("/all", authUser, getAllUsers);
userRouter.get("/admin/:id", authUser, getAdminCustomer);

export default userRouter;

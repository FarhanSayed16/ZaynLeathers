import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        success: false,
        message: "Not Authorized. Login again."
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * ✅ ADMIN TOKEN
     * Do not invent a fake user — user-only routes must require a real customer JWT.
     * Admin-capable shared routes (e.g. cancel) should check req.isAdmin.
     */
    if (decoded.role === "admin") {
      req.isAdmin = true;
      return next();
    }

    /**
     * ✅ NORMAL USER TOKEN
     */
    if (!decoded.id) {
      return res.json({
        success: false,
        message: "Invalid token"
      });
    }

    req.userId = decoded.id;

    req.user = await userModel
      .findById(decoded.id)
      .select("-password");

    if (!req.user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    next();

  } catch (error) {
    return res.json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

/** Allows guest requests; attaches user only when a valid customer token is present. */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin") {
      req.isAdmin = true;
      return next();
    }

    if (decoded.id) {
      req.userId = decoded.id;
      req.user = await userModel.findById(decoded.id).select("-password");
    }
  } catch {
    // Expired or invalid token — proceed as guest checkout
  }

  next();
};

export default authUser;
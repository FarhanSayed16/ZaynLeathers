import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "dotenv/config";

const app = express(); // ✅ FIRST create app
const port = process.env.PORT || 4000;

import connectDB from "./config/mongodb.js";
import connectClodinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import wishlistRouter from "./routes/WishlistRoute.js";
import videoReviewRouter from "./routes/videoReviewRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";

import couponRouter from "./routes/couponRoutes.js";
import adminHeroRoutes from "./routes/adminHeroRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import instagramPromoRoutes from "./routes/instagramPromoRoutes.js";
import exchangeRateRouter from "./routes/exchangeRateRoute.js";

// ✅ IMPORT CONTACT ROUTE
import contactRoutes from "./routes/contactRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// DB + Cloudinary
connectDB();
connectClodinary();

// Middlewares
app.use(express.json());
function extraCorsOrigins() {
  return String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://afiyaleather.com",
  "https://www.afiyaleather.com",
  "https://leathers-brand.vercel.app",
  "https://leathers-brand-frontend.vercel.app",
  "https://g6xrghvh-5173.inc1.devtunnels.ms",
  "https://g6xrghvh-5174.inc1.devtunnels.ms",
  ...extraCorsOrigins(),
]
  .filter(Boolean)
  .map((value) => String(value).replace(/\/$/, ""));

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol === "https:" && hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    console.warn(`[CORS] blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
}));
app.options("*", cors());

// Rate Limiter — general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use("/api/", limiter);

// Auth rate limits live on userRouter (per-route). Avoid double-limiting here.

// 🔥🔥🔥 FIX (THIS WAS MISSING)
app.use("/uploads", express.static("uploads"));

// ✅ ADD CONTACT ROUTE HERE (after app init)
app.use("/api/contact", contactRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/analytics", analyticsRoutes);

// Routes
app.use("/api/admin", adminHeroRoutes);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/video-reviews", videoReviewRouter);
app.use("/api/settings", settingsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/instagram", instagramPromoRoutes);
app.use("/api/exchange-rates", exchangeRateRouter);

// Test route
app.get("/", (req, res) => {
  res.status(200).send("API Working properly 🚀");
});

// Start server
app.listen(port, () => {
  console.log("Server Started on PORT: " + port);
  import("./utils/analytics/digestScheduler.js")
    .then(({ maybeSendDailyDigest }) => {
      setInterval(() => {
        maybeSendDailyDigest().catch((err) =>
          console.error("[digest] scheduler:", err.message)
        );
      }, 60_000);
    })
    .catch(() => {});
});

export default app;

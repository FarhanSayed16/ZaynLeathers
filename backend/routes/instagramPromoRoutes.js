import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import InstagramPromo from "../models/InstagramPromo.js";
import adminAuth from "../middleware/adminAuth.js";
import brand from "../../shared/brand.config.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cloudRoot = () =>
  process.env.CLOUDINARY_FOLDER ||
  brand.commerce?.cloudinaryFolder ||
  brand.id ||
  "uploads";

const isValidInstagramUrl = (url = "") => {
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return false;
    return /\/(p|reel|reels|tv)\//i.test(u.pathname) || /\/stories\//i.test(u.pathname) || u.pathname.length > 1;
  } catch {
    return false;
  }
};

router.get("/", async (req, res) => {
  try {
    const promos = await InstagramPromo.find({ isActive: true }).sort({ sequence: 1 });
    res.json({ success: true, promos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin", adminAuth, async (req, res) => {
  try {
    const promos = await InstagramPromo.find({}).sort({ sequence: 1 });
    res.json({ success: true, promos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Paste Instagram URL (image optional) */
router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { instagramLink, caption, productLink, sequence } = req.body;

    if (!instagramLink || !isValidInstagramUrl(instagramLink)) {
      return res.status(400).json({
        success: false,
        message: "Valid Instagram post/reel URL is required (instagram.com/p/... or /reel/...)",
      });
    }

    let imageUrl = "";
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: `${cloudRoot()}/instagram`,
      });
      imageUrl = result.secure_url;
    }

    const promo = new InstagramPromo({
      image: imageUrl,
      instagramLink,
      caption,
      productLink,
      sequence: sequence || 0,
    });

    await promo.save();
    res.json({ success: true, message: "Promo added", promo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/toggle", adminAuth, async (req, res) => {
  try {
    const promo = await InstagramPromo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, message: "Promo not found" });
    }
    promo.isActive = !promo.isActive;
    await promo.save();
    res.json({
      success: true,
      message: `Promo ${promo.isActive ? "Enabled" : "Disabled"}`,
      promo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const promo = await InstagramPromo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, message: "Promo not found" });
    }
    if (promo.image && promo.image.includes("cloudinary")) {
      try {
        const publicId = promo.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`instagram-promos/${publicId}`);
      } catch {
        /* ignore cleanup errors */
      }
    }
    await InstagramPromo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Promo deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

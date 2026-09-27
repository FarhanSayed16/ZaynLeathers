import express from "express";
import multer from "multer";
import HeroBanner from "../models/HeroBanner.js";
const router = express.Router();
import { v2 as cloudinary } from "cloudinary";
import adminAuth from "../middleware/adminAuth.js";
import sharp from "sharp";
import brand from "../../shared/brand.config.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const cloudRoot = () =>
  process.env.CLOUDINARY_FOLDER ||
  brand.commerce?.cloudinaryFolder ||
  brand.id ||
  "uploads";

/* =============================
   POST - Upload / Update Hero
============================= */
router.post("/hero", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, subtitle, ctaLabel, ctaLink, sequence } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // 🔥 Compress and resize image using sharp
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 🔥 Convert compressed buffer to base64
    const base64Image = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;

    // 🔥 Upload directly (NO upload_stream)
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `${cloudRoot()}/heroes`,
    });

    await HeroBanner.updateOne(
      { sequence },
      {
        $set: {
          image: result.secure_url,
          title,
          subtitle,
          ctaLabel,
          ctaLink,
          isActive: true,
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Hero updated successfully",
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =============================
   GET ALL HEROES (ADMIN)
============================= */
router.get("/hero", async (req, res) => {
  try {
    const heroes = await HeroBanner.find({})
      .sort({ sequence: 1 });

    res.json({
      success: true,
      heroes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =============================
   TOGGLE HERO
============================= */
router.patch("/hero/toggle/:sequence", adminAuth, async (req, res) => {
  try {
    const seq = parseInt(req.params.sequence);

    const hero = await HeroBanner.findOne({ sequence: seq });

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero not found",
      });
    }

    hero.isActive = !hero.isActive;
    await hero.save();

    res.json({
      success: true,
      message: `Hero ${hero.isActive ? "Enabled" : "Disabled"}`,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =============================
   DELETE HERO
============================= */
router.delete("/hero/:sequence", adminAuth, async (req, res) => {
  try {
    const seq = parseInt(req.params.sequence);

    const hero = await HeroBanner.findOne({ sequence: seq });

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero not found",
      });
    }

    if (hero.image) {
      const publicId = hero.image.split("/").pop().split(".")[0];

      await cloudinary.uploader.destroy(
        `hero-banners/${publicId}`
      );
    }

    await HeroBanner.deleteOne({ sequence: seq });

    res.json({
      success: true,
      message: "Hero deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
import VideoReview from "../models/VideoReview.js";
import {v2 as cloudinary} from 'cloudinary'
import streamifier from "streamifier";

// 🔥 Upload Review (STREAM → Cloudinary)
export const uploadReview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File not received",
      });
    }

    const { title, description, outfit } = req.body;

    // 🔥 STREAM upload (no disk)
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "video" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();

    console.log("Cloudinary Upload:", result.secure_url);

    const newReview = await VideoReview.create({
      video: result.secure_url,
      title,
      description,
      outfit,
    });

    res.status(201).json({
      success: true,
      message: "Review uploaded successfully",
      data: newReview,
    });
  } catch (err) {
    console.log("❌ Upload Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// 👉 Get Reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await VideoReview.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
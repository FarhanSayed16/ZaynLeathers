import multer from "multer";

// ✅ MEMORY STORAGE (VERCEL SAFE)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // optional (50MB)
  },
});

export default upload;

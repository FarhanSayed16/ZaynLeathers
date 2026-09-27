import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export function uploadPdfBuffer(buffer, { folder, publicId }) {
  const baseFolder = process.env.CLOUDINARY_FOLDER || "afiya-leathers";
  const targetFolder = folder ? `${baseFolder}/${folder}` : `${baseFolder}/invoices`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: targetFolder,
        public_id: publicId,
        format: "pdf",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function fetchPdfBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch PDF");
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

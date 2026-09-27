import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";

export default function AdminReview() {
  const videoReviewsUrl = `${backendUrl}/api/video-reviews`;
  const [form, setForm] = useState({
    title: "",
    description: "",
    outfit: "",
  });

  const [video, setVideo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchReviews = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(videoReviewsUrl);
      setReviews(Array.isArray(res.data) ? res.data : res.data?.reviews || []);
    } catch {
      toast.error("Could not load homepage videos");
      setReviews([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) {
      toast.error("Choose a video file first");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("video", video);
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("outfit", form.outfit);

      const res = await axios.post(`${videoReviewsUrl}/upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...adminHeaders(localStorage.getItem("token")),
        },
      });

      if (res.data?.success === false) {
        toast.error(res.data.error || res.data.message || "Upload failed");
        return;
      }

      setShowSuccess(true);
      setForm({ title: "", description: "", outfit: "" });
      setVideo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setShowSuccess(false), 2200);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(`${videoReviewsUrl}/${deleteId}`, {
        headers: adminHeaders(localStorage.getItem("token")),
      });
      if (res.data?.success === false) {
        toast.error(res.data.error || res.data.message || "Delete failed");
        return;
      }
      toast.success("Video deleted");
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Delete failed");
    } finally {
      setShowModal(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="relative space-y-8">
      <PageHeader
        title="Homepage videos"
        subtitle="Upload short UGC clips for the storefront carousel. Opens on the shop home — not product star reviews."
      />

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-scaleIn">
            <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center bg-green-100 rounded-full">
              <span className="text-green-600 text-2xl">✔</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Upload successful</h2>
            <p className="text-sm text-gray-500 mt-1">Your video has been uploaded successfully</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto mb-2 bg-white p-6 rounded-2xl border border-tz-pink-soft shadow-sm">
        <h2 className="text-lg font-display font-semibold mb-5 text-tz-navy">Upload homepage video</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={(e) => setVideo(e.target.files[0])}
            required
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />

          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />

          <input
            type="text"
            placeholder="Outfit"
            value={form.outfit}
            onChange={(e) => setForm({ ...form, outfit: e.target.value })}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white flex items-center justify-center gap-2 transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </form>
      </div>

      <h2 className="text-lg font-display font-semibold mb-4 text-tz-navy">Uploaded videos</h2>

      {listLoading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm bg-white border border-dashed rounded-2xl p-8 text-center">
          No homepage videos yet. Upload one above.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reviews.map((item) => (
            <div
              key={item._id}
              className="border rounded-xl overflow-hidden shadow hover:shadow-xl transition"
            >
              <video
                src={item.video}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-48 object-cover"
              />

              <div className="p-3">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.description}</p>

                <button
                  type="button"
                  onClick={() => openDeleteModal(item._id)}
                  className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded w-full"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-[300px] text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Delete video?</h2>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete this video?</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1 border rounded">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="px-4 py-1 bg-red-500 text-white rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .animate-scaleIn {
            animation: scaleIn 0.3s ease;
          }
          @keyframes scaleIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

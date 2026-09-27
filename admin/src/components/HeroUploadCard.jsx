import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import CustomAlert from "./CustomAlert";

const HeroUploadCard = ({ sequence, existingHero, onUpdated }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [alertData, setAlertData] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    if (existingHero) {
      setTitle(existingHero.title || "");
      setSubtitle(existingHero.subtitle || "");
      setCtaLabel(existingHero.ctaLabel || "");
      setCtaLink(existingHero.ctaLink || "");
      setPreview(existingHero.image || "");
    }
  }, [existingHero]);

  const showAlert = (data) => {
    setAlertData({ ...data, show: true });
  };

  const closeAlert = () => {
    setAlertData((prev) => ({ ...prev, show: false }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      if (image) formData.append("image", image);
      formData.append("title", title || "");
      formData.append("subtitle", subtitle || "");
      formData.append("ctaLabel", ctaLabel || "");
      formData.append("ctaLink", ctaLink || "");
      formData.append("sequence", Number(sequence));

      const res = await axios.post(
        `${backendUrl}/api/admin/hero`,
        formData,
        {
          headers: adminHeaders(localStorage.getItem("token")),
        }
      );

      if (res.data.success) {
        showAlert({
          title: "Success 🎉",
          message: "Hero updated successfully",
          type: "success",
          onConfirm: closeAlert,
        });
        setImage(null);
        onUpdated();
      }
    } catch (err) {
      showAlert({
        title: "Error ❌",
        message: err.response?.data?.message || "Update failed",
        type: "error",
        onConfirm: closeAlert,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const res = await axios.patch(
        `${backendUrl}/api/admin/hero/toggle/${sequence}`,
        {},
        {
          headers: adminHeaders(localStorage.getItem("token")),
        }
      );

      showAlert({
        title: "Updated ✅",
        message: res.data.message,
        type: "success",
        onConfirm: closeAlert,
      });

      onUpdated();
    } catch (err) {
      showAlert({
        title: "Error ❌",
        message: "Toggle failed",
        type: "error",
        onConfirm: closeAlert,
      });
    }
  };

  const handleDelete = () => {
    showAlert({
      title: "Delete Hero?",
      message: "Are you sure you want to delete this hero?",
      type: "error",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: confirmDelete,
      onCancel: closeAlert,
    });
  };

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(
        `${backendUrl}/api/admin/hero/${sequence}`,
        {
          headers: adminHeaders(localStorage.getItem("token")),
        }
      );

      closeAlert();

      showAlert({
        title: "Deleted 🗑️",
        message: res.data.message,
        type: "success",
        onConfirm: closeAlert,
      });

      onUpdated();
    } catch (err) {
      closeAlert();
      showAlert({
        title: "Error ❌",
        message: "Delete failed",
        type: "error",
        onConfirm: closeAlert,
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Hero Banner {sequence}</h3>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-semibold text-tz-navy">Tip:</span> For the perfect edge-to-edge fit, upload images sized exactly <span className="font-bold">1920x800</span>.
        </p>
      </div>

      {preview && (
        <img
          src={preview}
          alt="Hero Preview"
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full"
      />

      <input
        type="text"
        placeholder="Hero Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Hero Subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Button Label (e.g. SHOP NOW)"
        value={ctaLabel}
        onChange={(e) => setCtaLabel(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Button Link (e.g. /shop)"
        value={ctaLink}
        onChange={(e) => setCtaLink(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Updating..." : "Update Hero"}
      </button>

      {existingHero && (
        <button
          onClick={handleToggle}
          className={`w-full py-2 rounded ${
            existingHero.isActive
              ? "bg-yellow-500"
              : "bg-green-600"
          } text-white`}
        >
          {existingHero.isActive ? "Disable" : "Enable"}
        </button>
      )}

      {existingHero && (
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          Delete Hero
        </button>
      )}

      {/* Custom Alert */}
      <CustomAlert {...alertData} />
    </div>
  );
};

export default HeroUploadCard;
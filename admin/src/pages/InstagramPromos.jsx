import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";
import { assets } from "../assets/assets";

const InstagramPromos = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    instagramLink: "",
    caption: "",
    productLink: "",
    sequence: 0,
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/instagram/admin`, {
        headers: adminHeaders(),
      });
      if (res.data.success) setPromos(res.data.promos);
    } catch {
      toast.error("Failed to fetch Instagram promos");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.instagramLink) return toast.error("Instagram URL is required");

    setLoading(true);
    try {
      const form = new FormData();
      if (image) form.append("image", image);
      form.append("instagramLink", formData.instagramLink);
      form.append("caption", formData.caption);
      form.append("productLink", formData.productLink);
      form.append("sequence", formData.sequence);

      const res = await axios.post(`${backendUrl}/api/instagram`, form, {
        headers: adminHeaders(),
      });

      if (res.data.success) {
        toast.success("Promo added — paste URL is enough; image is optional");
        setImage(null);
        setFormData({ instagramLink: "", caption: "", productLink: "", sequence: 0 });
        fetchPromos();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add promo");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(
        `${backendUrl}/api/instagram/${id}/toggle`,
        {},
        { headers: adminHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchPromos();
      }
    } catch {
      toast.error("Failed to toggle promo");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promo?")) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/instagram/${id}`, {
        headers: adminHeaders(),
      });
      if (res.data.success) {
        toast.success("Promo deleted");
        fetchPromos();
      }
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-tz-navy">Instagram</h1>
        <p className="text-sm text-tz-navy/50 mt-1">
          Paste a post or reel URL. Thumbnail is optional — the shop uses a placeholder if you skip it.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
        <h3 className="text-lg font-bold mb-4">Add by Instagram link</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="imageUpload" className="block w-full aspect-square md:aspect-video rounded-2xl border-2 border-dashed border-tz-pink/40 hover:border-tz-pink overflow-hidden bg-tz-cream cursor-pointer">
              <img
                src={image ? URL.createObjectURL(image) : assets.upload_area}
                alt="Optional thumbnail"
                className={`w-full h-full ${image ? "object-cover" : "object-contain p-8 opacity-60"}`}
              />
              <input type="file" id="imageUpload" hidden accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">Optional thumbnail</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instagram URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                placeholder="https://www.instagram.com/p/.... or /reel/...."
                value={formData.instagramLink}
                onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
                className="w-full border p-2.5 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caption (optional)</label>
              <input
                type="text"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="w-full border p-2.5 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shop link (optional)</label>
              <input
                type="text"
                placeholder="/product/ID"
                value={formData.productLink}
                onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                className="w-full border p-2.5 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                value={formData.sequence}
                onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) || 0 })}
                className="w-full border p-2.5 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tz-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-tz-pink disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add promo"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold text-tz-navy mb-4">Current posts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {promos.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-tz-pink-soft to-tz-blue-soft">
                {p.image ? (
                  <img src={p.image} alt="" className={`w-full h-full object-cover ${!p.isActive && "opacity-50 grayscale"}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-tz-navy/50 text-xs p-2 text-center">No thumbnail</div>
                )}
              </div>
              <div className="p-3">
                <a href={p.instagramLink} target="_blank" rel="noreferrer" className="text-xs text-tz-blue hover:underline break-all block mb-1">
                  Open on Instagram
                </a>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <button onClick={() => handleToggle(p._id)} className={`text-xs font-medium ${p.isActive ? "text-green-600" : "text-gray-500"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="text-xs font-medium text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {promos.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed">
              No Instagram promos yet — paste a post URL above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramPromos;

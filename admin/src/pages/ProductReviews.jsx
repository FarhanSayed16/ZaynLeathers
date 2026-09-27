import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";
import { adminThumb, imageSrc } from "../utils/media";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";

const ProductReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/reviews/admin`, {
        headers: adminHeaders(token),
      });
      setReviews(Array.isArray(res.data) ? res.data : res.data.reviews || []);
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hide = async (id, isHidden) => {
    try {
      await axios.patch(
        `${backendUrl}/api/reviews/mod/${id}`,
        { isHidden },
        { headers: adminHeaders(token) }
      );
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${backendUrl}/api/reviews/mod/${deleteId}`, {
        headers: adminHeaders(token),
      });
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="Product reviews (PDP stars)"
        subtitle="Moderate star ratings on product pages — separate from homepage videos."
      />
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="bg-white border border-dashed rounded-2xl p-8 text-center text-gray-500">
          No product reviews yet.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const product = r.productId && typeof r.productId === "object" ? r.productId : null;
            return (
              <div
                key={r._id}
                className={`bg-white border rounded-2xl p-4 ${r.isHidden ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3">
                  {product?.image?.[0] && (
                    <img
                      src={adminThumb(imageSrc(product.image[0]))}
                      alt=""
                      className="w-14 h-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{product?.name || "Product"}</p>
                    <p className="text-sm">
                      {r.name} · {r.rating}/5
                      {r.isHidden ? " · hidden from shop" : ""}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 text-sm">
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => hide(r._id, !r.isHidden)}
                  >
                    {r.isHidden ? "Show on shop" : "Hide from shop"}
                  </button>
                  <button
                    type="button"
                    className="text-red-600 font-semibold"
                    onClick={() => setDeleteId(r._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete review?"
        message="This cannot be undone."
        confirmText="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ProductReviews;

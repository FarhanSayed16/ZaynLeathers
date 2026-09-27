import { useEffect, useState } from "react";
import { backendUrl } from "../App";
import axios from "axios";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const Coupon = ({ token }) => {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/coupons`, {
        headers: adminHeaders(token),
      });
      setCoupons(res.data.coupons || []);
    } catch {
      toast.error("Failed to load coupons");
    }
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${backendUrl}/api/coupons`,
        {
          code,
          discount,
          expiry,
          usageLimit: usageLimit || 0,
          minOrderAmount: minOrderAmount || 0,
        },
        { headers: adminHeaders(token) }
      );
      toast.success(res.data.message || "Created");
      setCode("");
      setDiscount("");
      setExpiry("");
      setUsageLimit("");
      setMinOrderAmount("");
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error creating coupon");
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await axios.patch(
        `${backendUrl}/api/coupons/${coupon._id}`,
        { isActive: coupon.isActive === false },
        { headers: adminHeaders(token) }
      );
      fetchCoupons();
    } catch {
      toast.error("Could not update coupon");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${backendUrl}/api/coupons/${deleteId}`, {
        headers: adminHeaders(token),
      });
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeleteId(null);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Percent-off codes shown on the cart when they are active and not expired."
      />

      <div className="bg-white rounded-2xl border border-tz-pink-soft p-5">
        <h2 className="font-semibold mb-4">Create coupon</h2>
        <form onSubmit={createCoupon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Code e.g. ZAYN10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="number"
              placeholder="Discount %"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="number"
              min="0"
              placeholder="Use limit (0 = ∞)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="number"
              min="0"
              placeholder="Min order ₹"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-tz-navy text-white text-sm px-5 py-2 rounded-lg">
            Create
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-tz-pink-soft p-5">
        <h2 className="font-semibold mb-4">Existing</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-gray-500">No coupons yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {coupons.map((coupon) => {
              const expired = new Date(coupon.expiry) < new Date();
              const used = coupon.usedBy?.length || 0;
              return (
                <div key={coupon._id} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-lg">{coupon.code}</p>
                      <p className="text-sm">{coupon.discount}% off</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Used {used}
                        {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : " (unlimited)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min order ₹{coupon.minOrderAmount || 0} · expires{" "}
                        <span className={expired ? "text-red-600" : ""}>
                          {new Date(coupon.expiry).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-xs mt-1 font-semibold">
                        {coupon.isActive === false ? "Paused" : expired ? "Expired" : "Active"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="text-xs border rounded-lg px-3 py-1.5"
                        onClick={() => toggleActive(coupon)}
                      >
                        {coupon.isActive === false ? "Enable" : "Pause"}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5"
                        onClick={() => setDeleteId(coupon._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete coupon?"
        message="Customers will no longer be able to use this code."
        confirmText="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Coupon;

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { adminHeaders, formatAdminAddress } from "../utils/adminApi";
import WhatsAppCompose from "../components/WhatsAppCompose";
import PageHeader from "../components/PageHeader";

const UserDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/user/admin/${id}`, {
          headers: adminHeaders(token),
        });
        if (res.data.success) setData(res.data);
        else toast.error(res.data.message);
      } catch {
        toast.error("Could not load customer");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-2 border-tz-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Customer not found.</p>
        <Link to="/users" className="underline text-sm font-semibold">
          Back to users
        </Link>
      </div>
    );
  }

  const { user, orders = [], cartQty = 0, wishlistCount = 0 } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`.trim() || "Customer"}
        subtitle={`${user.email}${user.phone ? ` · ${user.phone}` : ""} · Orders linked to this account only (guest checkout orders are not shown).`}
      />
      <Link to="/users" className="text-sm text-tz-navy/60 hover:text-tz-navy inline-block">
        ← All customers
      </Link>
      <p className="text-sm text-gray-500">
        {user.isVerified ? "Verified email" : "Email not verified"} · Cart items: {cartQty} · Wishlist: {wishlistCount} · Joined{" "}
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
      </p>

      <WhatsAppCompose mode="customer" user={user} order={orders[0]} />

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold mb-3">Addresses</h2>
        {(user.addresses || []).length === 0 && (
          <p className="text-sm text-gray-500">No saved addresses.</p>
        )}
        <div className="space-y-3">
          {(user.addresses || []).map((addr) => (
            <div key={addr._id} className="text-sm border rounded-xl p-3">
              <p className="font-medium">
                {addr.label || "Address"} {addr.isDefault ? "· default" : ""}
              </p>
              <p className="whitespace-pre-line text-gray-600">{formatAdminAddress(addr)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold mb-3">Orders ({orders.length})</h2>
        {orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              className="flex justify-between gap-3 border rounded-xl p-3 text-sm hover:bg-tz-cream"
            >
              <span>#{String(o._id).slice(-8)}</span>
              <span>₹{o.amount}</span>
              <span>{o.paymentMethod}</span>
              <span>{(o.items || [])[0]?.status || "—"}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default UserDetail;

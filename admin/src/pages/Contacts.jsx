import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";
import { isWhatsAppEnabled, useAdminFeatures } from "../context/AdminFeaturesContext";

const Contacts = () => {
  const { features } = useAdminFeatures();
  const whatsappOn = isWhatsAppEnabled(features);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const token = localStorage.getItem("token");

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/contact`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) setContacts(res.data.contacts || []);
    } catch {
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const patch = async (id, body) => {
    try {
      const res = await axios.patch(`${backendUrl}/api/contact/${id}`, body, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        setContacts((prev) => prev.map((c) => (c._id === id ? res.data.contact : c)));
      }
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`${backendUrl}/api/contact/${id}`, { headers: adminHeaders(token) });
      setContacts((prev) => prev.filter((c) => c._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const shown = contacts.filter((c) => {
    if (filter === "unread") return !c.isRead;
    if (filter === "read") return c.isRead;
    return true;
  });
  const unread = contacts.filter((c) => !c.isRead).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Inbox"
        subtitle={`${unread} unread message${unread === 1 ? "" : "s"} from the contact form.`}
        actions={
          <div className="flex gap-2">
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`admin-chip capitalize ${
                  filter === f ? "bg-tz-navy text-white" : "bg-white border border-tz-pink-soft text-tz-navy"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {shown.map((c) => {
            const phone = String(c.phone || "").replace(/\D/g, "");
            return (
              <div
                key={c._id}
                className={`bg-white border rounded-2xl p-4 shadow-sm ${
                  c.isRead ? "border-tz-pink-soft" : "border-tz-navy/30 ring-1 ring-tz-navy/10"
                }`}
              >
                <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <p className="font-semibold text-tz-navy">
                    {c.name} {!c.isRead && <span className="text-xs text-tz-pink">New</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <p className="text-sm text-gray-600">{c.email} · {c.phone}</p>
                <p className="text-sm mt-2 text-gray-800 whitespace-pre-wrap">{c.message}</p>
                <textarea
                  className="mt-3 w-full border rounded-lg text-sm p-2"
                  rows={2}
                  placeholder="Internal note"
                  defaultValue={c.adminNote || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (c.adminNote || "")) {
                      patch(c._id, { adminNote: e.target.value });
                    }
                  }}
                />
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  {c.email && (
                    <a className="underline font-semibold" href={`mailto:${c.email}`}>
                      Email
                    </a>
                  )}
                  {phone && (
                    <a className="underline font-semibold" href={`tel:${phone}`}>
                      Call
                    </a>
                  )}
                  {whatsappOn && phone.length >= 10 && (
                    <a
                      className="underline font-semibold"
                      href={`https://wa.me/91${phone.slice(-10)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => patch(c._id, { isRead: !c.isRead })}
                  >
                    {c.isRead ? "Mark unread" : "Mark read"}
                  </button>
                  <button type="button" className="text-red-600 font-semibold" onClick={() => remove(c._id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && (
            <p className="text-gray-500 bg-white rounded-2xl border border-dashed p-8 text-center">
              No messages in this filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Contacts;

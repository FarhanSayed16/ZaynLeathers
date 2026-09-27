import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${backendUrl}/api/user/all`, {
          headers: adminHeaders(token),
        });
        if (res.data.success) setUsers(res.data.users || []);
        else toast.error(res.data.message);
      } catch {
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, [token, backendUrl]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.firstName} ${u.lastName} ${u.email} ${u._id}`.toLowerCase();
      if (hay.includes(q)) return true;
      const phone = String(u.phone || "").replace(/\D/g, "");
      return digits.length >= 4 && phone.includes(digits);
    });
  }, [users, query]);

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" subtitle="Search by name, email, or phone. Open a row for addresses and orders." />
      <div className="admin-card p-5">
      <input
        className="border rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4"
        placeholder="Search name, email, or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tz-cream/80 text-left text-xs uppercase tracking-wide text-tz-navy/70">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link to={`/users/${user._id}`} className="font-semibold underline">
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.phone || "—"}</td>
                <td className="p-3">{user.isVerified ? "Yes" : "No"}</td>
                <td className="p-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No customers match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Users;

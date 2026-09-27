import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";

const TYPE_OPTIONS = [
  { value: "department", label: "Department" },
  { value: "group", label: "Group" },
  { value: "category", label: "Category (leaf)" },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [newCat, setNewCat] = useState({
    name: "",
    type: "category",
    parentId: "",
    gender: "",
    order: 0,
  });

  const token = localStorage.getItem("token");

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories/admin`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        setCategories(res.data.categories || []);
        setTree(res.data.tree || []);
      }
    } catch {
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const parentOptions = useMemo(
    () =>
      categories.filter((c) => c.type === "department" || c.type === "group"),
    [categories]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const payload = {
        ...newCat,
        parentId: newCat.parentId || undefined,
        gender: newCat.gender || undefined,
      };
      const res = await axios.post(`${backendUrl}/api/categories`, payload, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        toast.success("Category added");
        setNewCat({ name: "", type: "category", parentId: "", gender: "", order: 0 });
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.patch(
        `${backendUrl}/api/categories/${id}/toggle`,
        {},
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCategories();
      }
    } catch {
      toast.error("Failed to toggle category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/categories/${id}`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        toast.success("Category deleted");
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const renderNode = (node, depth = 0) => (
    <div key={node._id} className="border-b last:border-0">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-tz-cream/50"
        style={{ paddingLeft: 16 + depth * 20 }}
      >
        <div className="min-w-0">
          <p className="font-medium text-tz-navy truncate">{node.name}</p>
          <p className="text-xs text-gray-500">
            {node.type} · {node.slug}
            {node.gender ? ` · ${node.gender}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              node.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {node.isActive ? "Active" : "Off"}
          </span>
          <button onClick={() => handleToggle(node._id)} className="text-sm text-tz-blue hover:underline">
            {node.isActive ? "Disable" : "Enable"}
          </button>
          <button onClick={() => handleDelete(node._id)} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>
      {(node.children || []).map((child) => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-tz-navy">Categories</h1>
        <p className="text-sm text-tz-navy/50 mt-1">
          {categories.length} nodes · tree for mega-menu and shop filters
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
        <h3 className="text-lg font-bold mb-4">Add category</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Name (e.g. Leather Jackets)"
            value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            className="border p-2.5 rounded-xl lg:col-span-2"
            required
          />
          <select
            value={newCat.type}
            onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
            className="border p-2.5 rounded-xl bg-white"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={newCat.parentId}
            onChange={(e) => setNewCat({ ...newCat, parentId: e.target.value })}
            className="border p-2.5 rounded-xl bg-white lg:col-span-2"
          >
            <option value="">No parent (top-level department)</option>
            {parentOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
          <select
            value={newCat.gender}
            onChange={(e) => setNewCat({ ...newCat, gender: e.target.value })}
            className="border p-2.5 rounded-xl bg-white"
          >
            <option value="">Gender (optional)</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-tz-navy text-white px-6 py-2.5 rounded-xl font-medium hover:bg-tz-pink disabled:opacity-50 lg:col-span-3"
          >
            {loading ? "Adding..." : "Add category"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Tip: Seed the full Zayn tree from the server with{" "}
          <code className="bg-tz-cream px-1 rounded">npm run seed:categories</code> in{" "}
          <code className="bg-tz-cream px-1 rounded">backend/</code>.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-tz-pink-soft/40 font-semibold text-tz-navy">
          Category tree
        </div>
        {tree.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-500">
            No categories yet. Run the category seed or add a department above.
          </p>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
};

export default Categories;

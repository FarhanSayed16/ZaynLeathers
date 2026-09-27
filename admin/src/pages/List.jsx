import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { FaEdit, FaTrash, FaEyeSlash, FaEye, FaCopy, FaChevronDown, FaChevronRight, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { adminHeaders } from '../utils/adminApi'
import { adminPreview, adminThumb, imageSrc } from '../utils/media'
import { assets } from '../assets/assets'
import PageHeader from '../components/PageHeader'
import { groupProductsByStyle, matrixSummary } from '../utils/styleGroups'

const List = ({ token }) => {

  // ===============================
  // ORIGINAL STATE (UNCHANGED LOGIC)
  // ===============================
  const [list, setList] = useState([])
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [query, setQuery] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState({})
  const [groupedView, setGroupedView] = useState(true)
  const [expandedStyles, setExpandedStyles] = useState(new Set())

  // ===============================
  // UI STATES (NEW – ONLY UI)
  // ===============================
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [preview, setPreview] = useState(null)

  const DEPT_FILTERS = [
    { key: "All", label: "All" },
    { key: "men", label: "Men" },
    { key: "women", label: "Women" },
    { key: "bags", label: "Bags" },
    { key: "accessories", label: "Accessories" },
    { key: "home-living", label: "Home" },
    { key: "sale", label: "Sale" },
  ];

  const currentList =
    selectedCategory === "All"
      ? list
      : list.filter(
          (item) =>
            item.department === selectedCategory ||
            item.category === selectedCategory
        );
  const searched = currentList.filter((item) => {
    const q = query.trim().toLowerCase();
    if (q && !`${item.name} ${item.secondaryName || ""} ${item.sku || ""} ${item.color || ""} ${item.category || ""} ${item.department || ""} ${item.parentId || ""}`.toLowerCase().includes(q)) {
      return false;
    }
    if (!groupedView && lowStockOnly && Number(item.availableQuantity) > 5) return false;
    return true;
  });

  const styleGroups = groupProductsByStyle(searched);
  const filteredGroups = lowStockOnly
    ? styleGroups.filter(
        (g) => g.totalQty <= 5 || g.variants.some((v) => Number(v.availableQuantity) <= 5)
      )
    : styleGroups;

  const toggleStyleExpanded = (parentId) => {
    setExpandedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const hideStyle = async (parentId, isActive) => {
    try {
      const res = await axios.post(
        backendUrl + "/api/product/visibility-style",
        { parentId, isActive },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchList();
      } else toast.error(res.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const renderVariantRow = (item) => (
    <div
      key={item._id}
      className={`grid grid-cols-[80px_2fr_90px_1fr_1fr_110px_40px_40px_40px_40px] items-center p-2 border-b text-sm bg-white ${
        item.isActive === false ? "opacity-50" : ""
      } ${Number(item.availableQuantity) <= 5 ? "bg-amber-50/80" : ""}`}
    >
      <button
        type="button"
        className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border ml-4"
        onClick={() => setPreview(imageSrc(item.image?.[0]))}
      >
        <img
          src={adminThumb(imageSrc(item.image?.[0])) || assets.placeholder_image}
          alt={item.imageAlt || item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = assets.placeholder_image
          }}
        />
      </button>
      <div>
        <p>{item.color || "—"} · {item.name}{item.isPrimaryListing ? " ★ primary" : ""}</p>
        <p className="text-[10px] text-gray-500 truncate">{matrixSummary(item)}</p>
      </div>
      <p className="text-xs font-mono">{item.sku || "—"}</p>
      <p className="text-xs">{item.department || item.category}</p>
      <p>₹{item.price}</p>
      <div className="flex items-center gap-1">
        <input
          type="number"
          className="w-14 border rounded px-1 py-0.5 text-xs"
          value={qtyDrafts[item._id] ?? item.availableQuantity}
          onChange={(e) =>
            setQtyDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))
          }
        />
        <button
          type="button"
          className="text-[10px] font-semibold underline"
          onClick={async () => {
            try {
              const res = await axios.post(
                backendUrl + "/api/product/stock",
                {
                  id: item._id,
                  availableQuantity: qtyDrafts[item._id] ?? item.availableQuantity,
                },
                { headers: adminHeaders(token) }
              )
              if (res.data.success) {
                toast.success("Qty saved")
                fetchList()
              } else toast.error(res.data.message)
            } catch (error) {
              toast.error(error.message)
            }
          }}
        >
          Save
        </button>
      </div>
      <div className='flex justify-center'>
        <button
          type="button"
          title={item.isActive === false ? "Show colour in shop" : "Hide colour from shop"}
          onClick={async () => {
            try {
              const res = await axios.post(
                backendUrl + "/api/product/visibility",
                { id: item._id, isActive: item.isActive === false },
                { headers: adminHeaders(token) }
              )
              if (res.data.success) {
                toast.success(res.data.message)
                fetchList()
              } else toast.error(res.data.message)
            } catch (error) {
              toast.error(error.message)
            }
          }}
        >
          {item.isActive === false ? (
            <FaEye className="text-tz-navy" />
          ) : (
            <FaEyeSlash className="text-gray-500" />
          )}
        </button>
      </div>
      <div className='flex justify-center'>
        <FaCopy
          className="cursor-pointer text-tz-navy"
          title="Duplicate as new style"
          onClick={async () => {
            try {
              const res = await axios.post(
                backendUrl + "/api/product/duplicate",
                { id: item._id },
                { headers: adminHeaders(token) }
              )
              if (res.data.success) {
                toast.success(res.data.message)
                fetchList()
              } else toast.error(res.data.message || "Duplicate failed")
            } catch (error) {
              toast.error(error.response?.data?.message || error.message || "Duplicate failed")
            }
          }}
        />
      </div>
      <div className='flex justify-center'>
        <FaTrash
          className="text-red-500 cursor-pointer"
          onClick={() => {
            setDeleteId(item._id)
            setShowConfirm(true)
          }}
        />
      </div>
      <div className='flex justify-center'>
        <FaEdit
          className="cursor-pointer"
          onClick={() => navigate(`/editProduct/${item._id}`)}
        />
      </div>
    </div>
  );
  // ===============================
  // PAGINATION LOGIC
  // ===============================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(
    (groupedView ? filteredGroups.length : searched.length) / itemsPerPage
  );
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = groupedView
    ? filteredGroups.slice(startIndex, endIndex)
    : searched.slice(startIndex, endIndex);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, query, lowStockOnly, groupedView]);

  // ===============================
  // FETCH LIST (UNCHANGED)
  // ===============================
  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list", {
        headers: adminHeaders(token),
      })
      if (response.data.success) {
        setList(response.data.products)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ===============================
  // DELETE PRODUCT (LOGIC SAME)
  // ===============================
  const removeProduct = async () => {
    try {
      const response = await axios.post(
        backendUrl + '/api/product/remove',
        { id: deleteId },
        { headers: adminHeaders(token) }
      )

      if (response.data.success) {
        await fetchList()

        // 🔥 CENTER SUCCESS MESSAGE
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 1500)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setShowConfirm(false)
      setDeleteId(null)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div className="space-y-4">

      <PageHeader
        title="Products"
        subtitle="Grouped by style — expand to manage colours, stock, and visibility."
      />

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        {DEPT_FILTERS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`admin-chip ${
              selectedCategory === cat.key
                ? "bg-tz-navy text-white"
                : "bg-white border border-tz-pink-soft text-tz-navy"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, SKU, colour, category…"
          className="border rounded-xl px-3 py-2 text-sm w-full sm:w-72 bg-white"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock (qty ≤ 5)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={groupedView}
            onChange={(e) => setGroupedView(e.target.checked)}
          />
          Group by style
        </label>
      </div>

      {/* TABLE */}
      {(groupedView ? filteredGroups.length : searched.length) > 0 ? (
        <div className="overflow-x-auto admin-card">
          <div className="min-w-[1100px]">

            {/* Header */}
            <div className='grid grid-cols-[80px_2fr_90px_1fr_1fr_110px_40px_40px_40px_40px] bg-tz-cream/80 p-2 text-xs font-semibold uppercase tracking-wide text-tz-navy/70'>
              <span>Image</span>
              <span>{groupedView ? "Style / colour" : "Name"}</span>
              <span>SKU</span>
              <span>Category</span>
              <span>Price</span>
              <span>Qty</span>
              <span className='text-center'>Hide</span>
              <span className='text-center'>Copy</span>
              <span className='text-center'>Del</span>
              <span className='text-center'>Edit</span>
            </div>

            {groupedView ? (
              paginatedList.map((group) => {
                const expanded = expandedStyles.has(group.parentId);
                const thumb = group.variants.find((v) => v.isPrimaryListing && v.isActive !== false)
                  || group.variants.find((v) => v.isActive !== false)
                  || group.variants[0];
                return (
                  <div key={group.parentId} className="border-b">
                    <div className="grid grid-cols-[80px_2fr_90px_1fr_1fr_110px_40px_40px_40px_40px] items-center p-2 text-sm bg-tz-cream/40">
                      <button
                        type="button"
                        className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border"
                        onClick={() => setPreview(imageSrc(thumb?.image?.[0]))}
                      >
                        <img
                          src={adminThumb(imageSrc(thumb?.image?.[0])) || assets.placeholder_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          className="mt-1 shrink-0 text-tz-navy"
                          onClick={() => toggleStyleExpanded(group.parentId)}
                        >
                          {expanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                        </button>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{group.secondaryName}</p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">{group.parentId}</p>
                          <p className="text-xs text-gray-600">
                            {group.variants.length} colour{group.variants.length === 1 ? "" : "s"} · {group.totalQty} in stock
                            {group.allHidden ? " · hidden" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">—</span>
                      <span className="text-xs">{group.department}</span>
                      <span className="text-xs text-gray-400">—</span>
                      <span className="text-xs text-gray-400">—</span>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          title={group.allHidden ? "Show entire style" : "Hide entire style"}
                          onClick={() => hideStyle(group.parentId, group.allHidden)}
                        >
                          {group.allHidden ? <FaEye className="text-tz-navy" /> : <FaEyeSlash className="text-gray-500" />}
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          title="Add colour"
                          className="text-tz-navy"
                          onClick={() => navigate(`/add?styleId=${encodeURIComponent(group.parentId)}`)}
                        >
                          <FaPlus size={14} />
                        </button>
                      </div>
                      <span />
                      <span />
                    </div>
                    {expanded && group.variants.map((item) => renderVariantRow(item))}
                  </div>
                );
              })
            ) : (
            /* Flat rows */
            paginatedList.map(item => (
              <div
                key={item._id}
                className={`grid grid-cols-[80px_2fr_90px_1fr_1fr_110px_40px_40px_40px_40px] items-center p-2 border-b text-sm ${
                  item.isActive === false ? "opacity-50" : ""
                } ${Number(item.availableQuantity) <= 5 ? "bg-amber-50/80" : ""}`}
              >
                <button
                  type="button"
                  className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border"
                  onClick={() => setPreview(imageSrc(item.image?.[0]))}
                >
                  <img
                    src={adminThumb(imageSrc(item.image?.[0])) || assets.placeholder_image}
                    alt={item.imageAlt || item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = assets.placeholder_image
                    }}
                  />
                </button>
                <p>{item.name}{item.featured ? " ★" : ""}{item.bestseller ? " • BS" : ""}{item.isActive === false ? " (hidden)" : ""}</p>
                <p className="text-xs font-mono">{item.sku || "—"}</p>
                <p>{item.department || item.category}{item.categorySlug ? ` / ${item.category}` : item.subCategory ? ` / ${item.subCategory}` : ""}</p>
                <p>₹{item.price}</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="w-14 border rounded px-1 py-0.5 text-xs"
                    value={qtyDrafts[item._id] ?? item.availableQuantity}
                    onChange={(e) =>
                      setQtyDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="text-[10px] font-semibold underline"
                    onClick={async () => {
                      try {
                        const res = await axios.post(
                          backendUrl + "/api/product/stock",
                          {
                            id: item._id,
                            availableQuantity: qtyDrafts[item._id] ?? item.availableQuantity,
                          },
                          { headers: adminHeaders(token) }
                        )
                        if (res.data.success) {
                          toast.success("Qty saved")
                          fetchList()
                        } else toast.error(res.data.message)
                      } catch (error) {
                        toast.error(error.message)
                      }
                    }}
                  >
                    Save
                  </button>
                </div>

                <div className='flex justify-center'>
                  <button
                    type="button"
                    title={item.isActive === false ? "Show in shop" : "Hide from shop"}
                    onClick={async () => {
                      try {
                        const res = await axios.post(
                          backendUrl + "/api/product/visibility",
                          { id: item._id, isActive: item.isActive === false },
                          { headers: adminHeaders(token) }
                        )
                        if (res.data.success) {
                          toast.success(res.data.message)
                          fetchList()
                        } else toast.error(res.data.message)
                      } catch (error) {
                        toast.error(error.message)
                      }
                    }}
                  >
                    {item.isActive === false ? (
                      <FaEye className="text-tz-navy" />
                    ) : (
                      <FaEyeSlash className="text-gray-500" />
                    )}
                  </button>
                </div>
                <div className='flex justify-center'>
                  <FaCopy
                    className="cursor-pointer text-tz-navy"
                    title="Duplicate"
                    onClick={async () => {
                      try {
                        const res = await axios.post(
                          backendUrl + "/api/product/duplicate",
                          { id: item._id },
                          { headers: adminHeaders(token) }
                        )
                        if (res.data.success) {
                          toast.success(res.data.message)
                          fetchList()
                        } else toast.error(res.data.message || "Duplicate failed")
                      } catch (error) {
                        toast.error(error.response?.data?.message || error.message || "Duplicate failed")
                      }
                    }}
                  />
                </div>
                <div className='flex justify-center'>
                  <FaTrash
                    className="text-red-500 cursor-pointer"
                    onClick={() => {
                      setDeleteId(item._id)
                      setShowConfirm(true)
                    }}
                  />
                </div>
                <div className='flex justify-center'>
                  <FaEdit
                    className="cursor-pointer"
                    onClick={() => navigate(`/editProduct/${item._id}`)}
                  />
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 bg-white rounded-xl border border-dashed p-8 text-center">
          No products match this filter. Try another department or search.
        </p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded text-sm ${
              currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border rounded text-sm ${
              currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={adminPreview(preview)}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-[320px] animate-scale">
            <h3 className="text-lg font-semibold text-center">Delete Product</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Are you sure you want to delete this product?
            </p>
            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 py-2 bg-gray-200 rounded"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-red-500 text-white rounded"
                onClick={removeProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS CENTER MESSAGE ================= */}
      {showSuccess && (
       <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="success-popup">
            <div className="success-icon">✓</div>
            <p className="success-text">Product removed successfully</p>
          </div>
        </div>
      )}

    </div>
  )
}

export default List
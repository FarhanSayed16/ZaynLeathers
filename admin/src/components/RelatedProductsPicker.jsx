import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import { adminPreview, imageSrc } from "../utils/media.js";

const MAX_RELATED = 8;

const RelatedProductsPicker = ({ token, currentId, currentParentId, value, onChange }) => {
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    axios
      .get(`${backendUrl}/api/product/list`, { headers: adminHeaders(token) })
      .then((res) => {
        if (res.data.success) setCatalog(res.data.products || []);
      })
      .catch(() => {});
  }, [token]);

  const selected = useMemo(
    () =>
      (value || [])
        .map((id) => catalog.find((p) => String(p._id) === String(id)))
        .filter(Boolean),
    [value, catalog]
  );

  const q = query.trim().toLowerCase();
  const suggestions = useMemo(() => {
    return catalog
      .filter((p) => {
        if (String(p._id) === String(currentId)) return false;
        if (currentParentId && p.parentId === currentParentId) return false;
        if ((value || []).includes(String(p._id))) return false;
        if (p.isActive === false) return false;
        if (!q) return true;
        const hay = [p.name, p.secondaryName, p.color, p.sku, p.department]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [catalog, currentId, currentParentId, value, q]);

  const add = (id) => {
    if ((value || []).length >= MAX_RELATED) return;
    onChange([...(value || []), String(id)]);
    setQuery("");
  };

  const remove = (id) => {
    onChange((value || []).filter((x) => String(x) !== String(id)));
  };

  return (
    <div className="rounded-xl border border-tz-pink-soft bg-white p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-tz-navy">Recommended products</p>
        <p className="text-xs text-tz-navy/50 mt-0.5">
          Pins apply to the whole style (all colours). Up to {MAX_RELATED} products. Leave empty
          for automatic similar items and frequently bought together.
        </p>
      </div>

      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map((p) => (
            <li
              key={p._id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 px-2 py-1.5"
            >
              <img
                src={adminPreview(imageSrc(Array.isArray(p.image) ? p.image[0] : p.image))}
                alt=""
                className="w-10 h-10 object-cover rounded-md bg-gray-50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.secondaryName || p.name}</p>
                <p className="text-[11px] text-gray-500">
                  {p.color}
                  {p.sku ? ` · ${p.sku}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(p._id)}
                className="text-xs font-semibold text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {(!value || value.length < MAX_RELATED) && (
        <div>
          <input
            className="border rounded-lg px-3 py-2 w-full text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalogue to pin a product…"
          />
          {query.trim() && (
            <ul className="mt-2 max-h-56 overflow-y-auto border rounded-lg divide-y">
              {suggestions.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-500">No matches</li>
              ) : (
                suggestions.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => add(p._id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-tz-cream flex items-center gap-2"
                    >
                      <span className="truncate">{p.secondaryName || p.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{p.color}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatedProductsPicker;

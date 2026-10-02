import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Full-width mega-menu panel anchored under the header chrome.
 * @param {{ columns: Array<{ title: string, links: Array<{ label: string, path: string }> }>, onNavigate?: () => void, onClose?: () => void, keyboardOpen?: boolean }} props
 */
const MegaMenu = ({ columns = [], onNavigate, onClose, keyboardOpen = false }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Only steal focus when opened via keyboard — hover must not scroll/focus
  useEffect(() => {
    if (!keyboardOpen) return undefined;
    const first = panelRef.current?.querySelector("a");
    first?.focus?.();
    return undefined;
  }, [keyboardOpen]);

  if (!columns.length) return null;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.16 }}
      className="absolute left-0 right-0 top-full z-[100] pt-0"
      role="region"
      aria-label="Category menu"
    >
      <div className="border-t border-gray-100 bg-white shadow-nav">
        <div className="max-w-[1400px] mx-auto px-6 xl:px-8 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tz-navy pb-2 mb-3 border-b border-tz-navy/80">
                {col.title}
              </p>
              <ul className="space-y-1.5">
                {(col.links || []).map((link) => (
                  <li key={link.path + link.label}>
                    <Link
                      to={link.path}
                      onClick={onNavigate}
                      className="text-[13px] text-tz-navy/70 hover:text-tz-navy hover:underline underline-offset-2 block py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tz-navy focus-visible:ring-offset-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Build mega columns from live category tree department, or brand fallback.
 */
export function buildMegaColumns(department, fallbackColumns = []) {
  if (!department) return fallbackColumns;

  const children = department.children || [];
  if (!children.length) return fallbackColumns;

  const cols = [
    { title: department.name || "Shop", links: [] },
    { title: "More", links: [] },
    { title: "Browse", links: [] },
    { title: "All", links: [{ label: `All ${department.name}`, path: `/shop?department=${department.slug}` }] },
  ];

  children.forEach((child, i) => {
    const colIndex = Math.min(i % 3, 2);
    const path =
      child.type === "group"
        ? `/shop?department=${department.slug}`
        : `/shop?department=${department.slug}&category=${child.slug}`;
    cols[colIndex].links.push({ label: child.name, path });

    (child.children || []).slice(0, 4).forEach((leaf) => {
      cols[colIndex].links.push({
        label: leaf.name,
        path: `/shop?department=${department.slug}&category=${leaf.slug}`,
      });
    });
  });

  const useful = cols.filter((c) => c.links.length > 0);
  return useful.length ? useful : fallbackColumns;
}

export default MegaMenu;

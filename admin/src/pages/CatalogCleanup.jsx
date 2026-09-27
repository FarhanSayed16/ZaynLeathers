import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";
import PageHeader from "../components/PageHeader";

const severityClass = {
  error: "bg-red-50 text-red-800 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
};

const CatalogCleanup = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/product/catalog-audit`, {
        headers: adminHeaders(token),
      });
      if (res.data.success) {
        setIssues(res.data.issues || []);
        setSummary(res.data.summary || null);
      } else {
        toast.error(res.data.message || "Audit failed");
      }
    } catch {
      toast.error("Failed to run catalog audit");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const filtered = useMemo(() => {
    if (filter === "all") return issues;
    if (filter === "fixable") return issues.filter((i) => i.fixable);
    return issues.filter((i) => i.severity === filter);
  }, [issues, filter]);

  const applyFix = async (fix) => {
    setFixing(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/product/catalog-fix`,
        { fix },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Fix applied");
        fetchAudit();
      } else {
        toast.error(res.data.message || "Fix failed");
      }
    } catch {
      toast.error("Fix request failed");
    } finally {
      setFixing(false);
    }
  };

  const fixAll = async () => {
    setFixing(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/product/catalog-fix`,
        { fixAll: true },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Fixes applied");
        fetchAudit();
      } else {
        toast.error(res.data.message || "Bulk fix failed");
      }
    } catch {
      toast.error("Bulk fix request failed");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Catalog cleanup"
        subtitle="Audit variant groups, size matrices, and primary listings. Auto-fix safe issues after migration."
        actions={
          <>
            <button
              type="button"
              onClick={fetchAudit}
              disabled={loading || fixing}
              className="px-4 py-2 rounded-xl border border-tz-navy/20 text-sm font-semibold disabled:opacity-60"
            >
              Re-run audit
            </button>
            {summary?.fixable > 0 && (
              <button
                type="button"
                onClick={fixAll}
                disabled={loading || fixing}
                className="px-4 py-2 rounded-xl bg-tz-navy text-white text-sm font-semibold disabled:opacity-60"
              >
                Fix all ({summary.fixable})
              </button>
            )}
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Products", summary.products],
            ["Styles", summary.styles],
            ["Errors", summary.errors],
            ["Warnings", summary.warnings],
            ["Fixable", summary.fixable],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white border border-tz-pink-soft p-4">
              <p className="text-[11px] uppercase tracking-wide text-tz-navy/45 font-bold">{label}</p>
              <p className="text-2xl font-display font-semibold text-tz-navy mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["error", "Errors"],
          ["warning", "Warnings"],
          ["fixable", "Fixable"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === value ? "bg-tz-navy text-white" : "bg-white border border-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Running audit…</p>
      ) : !filtered.length ? (
        <div className="rounded-xl bg-white border border-tz-pink-soft p-6 text-sm text-gray-600">
          No issues in this view. Your catalogue looks clean.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((issue) => (
            <li
              key={issue.id}
              className={`rounded-xl border p-4 text-sm ${severityClass[issue.severity] || "bg-white border-gray-200"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{issue.type.replace(/_/g, " ")}</p>
                  <p className="mt-1 opacity-90">{issue.message}</p>
                  {issue.parentId && (
                    <p className="text-xs mt-1 opacity-70 font-mono">style: {issue.parentId}</p>
                  )}
                  {issue.productId && (
                    <Link
                      to={`/editProduct/${issue.productId}`}
                      className="text-xs mt-1 inline-block underline font-semibold"
                    >
                      Edit product
                    </Link>
                  )}
                  {Array.isArray(issue.productIds) && issue.productIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {issue.productIds.map((id) => (
                        <Link
                          key={id}
                          to={`/editProduct/${id}`}
                          className="text-[11px] underline font-mono opacity-80"
                        >
                          {id.slice(-6)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {issue.fixable && issue.fix && (
                  <button
                    type="button"
                    disabled={fixing}
                    onClick={() => applyFix(issue.fix)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-tz-navy text-white text-xs font-semibold disabled:opacity-60"
                  >
                    Fix
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CatalogCleanup;

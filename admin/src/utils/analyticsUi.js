export function formatInr(n) {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${Math.round(v).toLocaleString("en-IN")}`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export function pctBadge(delta) {
  if (delta == null || Number.isNaN(delta)) return null;
  const up = delta >= 0;
  return { text: `${up ? "↑" : "↓"}${Math.abs(delta)}%`, up };
}

export const DATE_PRESETS = [
  { id: "today", label: "Today", days: 0 },
  { id: "this_week", label: "This week", special: "this_week" },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "mtd", label: "This month", special: "mtd" },
  { id: "last_month", label: "Last month", special: "last_month" },
];

export function resolvePreset(presetId) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const preset = DATE_PRESETS.find((p) => p.id === presetId) || DATE_PRESETS[2];

  if (preset.special === "mtd") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString().slice(0, 10), to };
  }

  if (preset.special === "this_week") {
    const day = now.getDay();
    const diffToMon = day === 0 ? 6 : day - 1;
    const mon = new Date(now);
    mon.setDate(now.getDate() - diffToMon);
    return { from: mon.toISOString().slice(0, 10), to };
  }

  if (preset.special === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: from.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }

  if (preset.days === 0) {
    return { from: to, to };
  }

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - preset.days);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

export function compareRange(from, to) {
  const fromD = new Date(from);
  const toD = new Date(to);
  const span = toD.getTime() - fromD.getTime();
  const compareTo = new Date(fromD.getTime() - 86400000);
  const compareFrom = new Date(compareTo.getTime() - span);
  return {
    compareFrom: compareFrom.toISOString().slice(0, 10),
    compareTo: compareTo.toISOString().slice(0, 10),
  };
}

export async function downloadAnalyticsCsv(url, token, filename) {
  const headers = {
    token: token || localStorage.getItem("token") || "",
    Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
  };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

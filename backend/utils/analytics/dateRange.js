/** YYYY-MM-DD in Asia/Kolkata */
export function istYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function istYesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return istYmd(d);
}

export function istTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { hour: get("hour"), minute: get("minute") };
}

export function parseRangeQuery(from, to, fallbackDays = 30) {
  const toDate = to ? new Date(to) : new Date();
  if (Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid end date");
  }
  toDate.setHours(23, 59, 59, 999);

  let fromDate;
  if (from) {
    fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) throw new Error("Invalid start date");
  } else {
    fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - fallbackDays);
  }
  fromDate.setHours(0, 0, 0, 0);

  if (fromDate > toDate) {
    throw new Error("Start date must be before end date");
  }

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    fromMs: fromDate.getTime(),
    toMs: toDate.getTime(),
    fromDate,
    toDate,
  };
}

export function orderInRangeMatch(fromMs, toMs) {
  return {
    $or: [
      { date: { $gte: fromMs, $lte: toMs } },
      {
        $and: [
          { $or: [{ date: { $exists: false } }, { date: null }] },
          { createdAt: { $gte: new Date(fromMs), $lte: new Date(toMs) } },
        ],
      },
    ],
  };
}

export function activeOrderMatch() {
  return {
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: "$items",
              as: "i",
              cond: { $ne: ["$$i.status", "Cancelled"] },
            },
          },
        },
        0,
      ],
    },
  };
}

export function pctChange(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c === 0 ? 0 : 100;
  return Math.round(((c - p) / p) * 1000) / 10;
}

export function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

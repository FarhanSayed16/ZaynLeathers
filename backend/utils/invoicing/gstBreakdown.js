import { normalizeState } from "./invoiceConfig.js";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function lineTaxBreakdown({ unitPrice, quantity, gstRate, pricesIncludeGst, isInterState }) {
  const qty = Number(quantity) || 1;
  const rate = Number(gstRate) || 0;
  const gross = round2(unitPrice * qty);

  if (!rate) {
    return {
      taxable: gross,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: gross,
    };
  }

  let taxable;
  let taxTotal;

  if (pricesIncludeGst) {
    taxable = round2(gross / (1 + rate / 100));
    taxTotal = round2(gross - taxable);
  } else {
    taxable = gross;
    taxTotal = round2(taxable * (rate / 100));
  }

  if (isInterState) {
    return {
      taxable,
      cgst: 0,
      sgst: 0,
      igst: taxTotal,
      total: pricesIncludeGst ? gross : round2(taxable + taxTotal),
    };
  }

  const half = round2(taxTotal / 2);
  return {
    taxable,
    cgst: half,
    sgst: round2(taxTotal - half),
    igst: 0,
    total: pricesIncludeGst ? gross : round2(taxable + taxTotal),
  };
}

export function buildInvoiceLines(order, config) {
  const sellerState = normalizeState(config.state);
  const buyerState = normalizeState(order.address?.state);
  const isInterState = sellerState && buyerState && sellerState !== buyerState;
  const useGst = Boolean(config.gstin);

  const activeItems = (order.items || []).filter((i) => i.status !== "Cancelled");

  const lines = activeItems.map((item) => {
    const gstRate = useGst
      ? Number(item.gstRate ?? config.defaultGstRate) || config.defaultGstRate
      : 0;
    const tax = lineTaxBreakdown({
      unitPrice: item.price,
      quantity: item.quantity,
      gstRate,
      pricesIncludeGst: config.pricesIncludeGst,
      isInterState,
    });

    return {
      name: item.name,
      sku: item.sku || "",
      hsn: item.hsnSac || config.defaultHsn || "",
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity,
      unitPrice: item.price,
      gstRate,
      ...tax,
    };
  });

  const itemsSubtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const grandTotal = round2(Number(order.amount) || itemsSubtotal);
  const adjustment = round2(grandTotal - itemsSubtotal);

  const totals = lines.reduce(
    (acc, l) => ({
      taxable: round2(acc.taxable + l.taxable),
      cgst: round2(acc.cgst + l.cgst),
      sgst: round2(acc.sgst + l.sgst),
      igst: round2(acc.igst + l.igst),
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  );

  if (adjustment !== 0) {
    totals.taxable = round2(totals.taxable + adjustment);
  }

  return {
    lines,
    itemsSubtotal,
    adjustment,
    isInterState,
    useGst,
    totals: {
      ...totals,
      grandTotal,
    },
  };
}

export function buildPaymentBlock(order, config) {
  const lines = [];
  lines.push(`Payment method: ${order.paymentMethod || "—"}`);
  lines.push(`Payment status: ${order.payment ? "Paid" : "Pending"}`);

  const pd = order.paymentDetails || {};
  if (order.paymentMethod === "Partial" || pd.advanceAmount) {
    if (pd.advanceAmount != null) lines.push(`Advance paid: Rs.${pd.advanceAmount}`);
    if (pd.balanceAmount != null && pd.balanceAmount > 0) {
      if (pd.balancePaid) {
        lines.push(`Balance paid: Rs.${pd.balanceAmount}`);
      } else {
        lines.push(`Balance due: Rs.${pd.balanceAmount}`);
      }
    }
    if (pd.balancePaid && pd.balanceAmount > 0) {
      lines.push("Balance collected on delivery");
    }
  }

  if (config.showPaymentIds) {
    if (pd.advancePaymentId) lines.push(`Razorpay payment ID: ${pd.advancePaymentId}`);
    if (pd.advanceOrderId) lines.push(`Razorpay order ID: ${pd.advanceOrderId}`);
  }

  return lines;
}

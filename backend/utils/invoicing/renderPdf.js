import PDFDocument from "pdfkit";
import { buildPaymentBlock } from "./gstBreakdown.js";

function money(n) {
  return `Rs.${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function writeTableRow(doc, cols, y, opts = {}) {
  const { bold = false, fontSize = 9 } = opts;
  doc.fontSize(fontSize).font(bold ? "Helvetica-Bold" : "Helvetica");
  let x = doc.page.margins.left;
  cols.forEach(({ text, width, align = "left" }) => {
    doc.text(String(text ?? ""), x, y, { width, align });
    x += width;
  });
}

export async function renderInvoicePdf({ order, config, invoiceNumber, docType, breakdown }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const title = docType === "tax_invoice" ? "TAX INVOICE" : "INVOICE / BILL";
    const addr = order.address || {};
    const billing = order.billing || {};
    const issued = new Date();

    doc.fontSize(18).font("Helvetica-Bold").text(config.tradeName || config.legalName, { align: "left" });
    doc.fontSize(9).font("Helvetica").fillColor("#444");
    if (config.legalName && config.legalName !== config.tradeName) {
      doc.text(config.legalName);
    }
    if (config.address) doc.text(config.address);
    const cityLine = [config.city, config.state, config.pincode].filter(Boolean).join(", ");
    if (cityLine) doc.text(cityLine);
    if (config.phone) doc.text(`Phone: ${config.phone}`);
    if (config.email) doc.text(`Email: ${config.email}`);
    if (config.gstin) doc.text(`GSTIN: ${config.gstin}`);
    if (config.pan) doc.text(`PAN: ${config.pan}`);

    doc.moveDown(0.5);
    doc.fillColor("#111").fontSize(14).font("Helvetica-Bold").text(title, { align: "right" });
    doc.fontSize(9).font("Helvetica").text(`Invoice No: ${invoiceNumber}`, { align: "right" });
    doc.text(`Date: ${issued.toLocaleDateString("en-IN")}`, { align: "right" });
    doc.text(`Order: ${String(order._id)}`, { align: "right" });

    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111").text("Bill To");
    doc.font("Helvetica").fontSize(9);
    const customerName = billing.companyName || `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    if (customerName) doc.text(customerName);
    if (billing.gstin) doc.text(`GSTIN: ${billing.gstin}`);
    doc.text(
      [addr.street, addr.apartment, addr.city, addr.state, addr.zipcode, addr.country]
        .filter(Boolean)
        .join(", ")
    );
    if (addr.phone) doc.text(`Phone: ${addr.phone}`);
    if (addr.email) doc.text(`Email: ${addr.email}`);

    doc.moveDown(1);
    const colWidths = breakdown.useGst
      ? [
          { width: 140, text: "Item" },
          { width: 45, text: "HSN" },
          { width: 30, text: "Qty" },
          { width: 55, text: "Rate" },
          { width: 45, text: "Taxable" },
          { width: 40, text: "Tax" },
          { width: 55, text: "Amount" },
        ]
      : [
          { width: 200, text: "Item" },
          { width: 40, text: "Qty" },
          { width: 70, text: "Rate" },
          { width: 80, text: "Amount" },
        ];

    let y = doc.y;
    writeTableRow(doc, colWidths, y, { bold: true });
    y += 16;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke("#ccc");
    y += 6;

    breakdown.lines.forEach((line) => {
      const meta = [line.color, line.size, line.sku].filter(Boolean).join(" · ");
      const itemLabel = meta ? `${line.name}\n${meta}` : line.name;
      const taxAmt = line.cgst + line.sgst + line.igst;

      if (breakdown.useGst) {
        writeTableRow(doc, [
          { width: 140, text: itemLabel },
          { width: 45, text: line.hsn },
          { width: 30, text: line.quantity },
          { width: 55, text: money(line.unitPrice) },
          { width: 45, text: money(line.taxable) },
          { width: 40, text: money(taxAmt) },
          { width: 55, text: money(line.total) },
        ], y);
      } else {
        writeTableRow(doc, [
          { width: 200, text: itemLabel },
          { width: 40, text: line.quantity },
          { width: 70, text: money(line.unitPrice) },
          { width: 80, text: money(line.total) },
        ], y);
      }
      y += meta ? 28 : 18;
    });

    if (breakdown.adjustment !== 0) {
      writeTableRow(
        doc,
        breakdown.useGst
          ? [
              { width: 140, text: "Shipping & adjustments" },
              { width: 45, text: "" },
              { width: 30, text: "" },
              { width: 55, text: "" },
              { width: 45, text: money(breakdown.adjustment) },
              { width: 40, text: "" },
              { width: 55, text: money(breakdown.adjustment) },
            ]
          : [
              { width: 200, text: "Shipping & adjustments" },
              { width: 40, text: "" },
              { width: 70, text: "" },
              { width: 80, text: money(breakdown.adjustment) },
            ],
        y
      );
      y += 18;
    }

    y += 8;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke("#ccc");
    y += 10;

    if (breakdown.useGst) {
      writeTableRow(
        doc,
        [
          { width: 300, text: "Taxable value", align: "right" },
          { width: 100, text: money(breakdown.totals.taxable), align: "right" },
        ],
        y
      );
      y += 14;
      if (breakdown.isInterState) {
        writeTableRow(doc, [{ width: 300, text: "IGST", align: "right" }, { width: 100, text: money(breakdown.totals.igst), align: "right" }], y);
        y += 14;
      } else {
        writeTableRow(doc, [{ width: 300, text: "CGST", align: "right" }, { width: 100, text: money(breakdown.totals.cgst), align: "right" }], y);
        y += 14;
        writeTableRow(doc, [{ width: 300, text: "SGST", align: "right" }, { width: 100, text: money(breakdown.totals.sgst), align: "right" }], y);
        y += 14;
      }
    }

    writeTableRow(
      doc,
      [
        { width: 300, text: "Grand Total", align: "right" },
        { width: 100, text: money(breakdown.totals.grandTotal), align: "right" },
      ],
      y,
      { bold: true, fontSize: 11 }
    );

    y += 24;
    doc.fontSize(9).font("Helvetica-Bold").text("Payment details", doc.page.margins.left, y);
    y += 14;
    doc.font("Helvetica").fontSize(8);
    buildPaymentBlock(order, config).forEach((line) => {
      doc.text(line, doc.page.margins.left, y);
      y += 12;
    });

    if (order.couponCode) {
      y += 4;
      doc.text(`Coupon applied: ${order.couponCode}`, doc.page.margins.left, y);
      y += 12;
    }

    if (config.bankDetails) {
      y += 8;
      doc.font("Helvetica-Bold").text("Bank details", doc.page.margins.left, y);
      y += 12;
      doc.font("Helvetica").text(config.bankDetails, doc.page.margins.left, y, { width: 500 });
      y += 40;
    }

    doc.fontSize(7).fillColor("#666").text(config.footerNotes || "", doc.page.margins.left, doc.page.height - 60, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: "center",
    });

    doc.end();
  });
}

export async function renderCreditNotePdf({ order, config, creditNoteNumber, reason, amount, invoiceNumber }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(config.tradeName || config.legalName);
    doc.fontSize(12).text("CREDIT NOTE", { align: "right" });
    doc.fontSize(9).font("Helvetica");
    doc.text(`Credit Note No: ${creditNoteNumber}`, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, { align: "right" });
    if (invoiceNumber) doc.text(`Against invoice: ${invoiceNumber}`, { align: "right" });
    doc.text(`Order: ${String(order._id)}`, { align: "right" });

    doc.moveDown(1);
    doc.text(`Reason: ${reason || "Return / adjustment"}`);
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica-Bold").text(`Credit amount: ${money(amount)}`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#666").text(config.footerNotes || "", { align: "center" });

    doc.end();
  });
}

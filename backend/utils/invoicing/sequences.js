import InvoiceSequence from "../../models/InvoiceSequence.js";
import { getFinancialYear } from "./invoiceConfig.js";

export async function nextDocumentNumber(prefix, date = new Date()) {
  const fy = getFinancialYear(date);
  const key = `${prefix.toLowerCase()}-${fy}`;
  const doc = await InvoiceSequence.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = String(doc.seq).padStart(5, "0");
  return `${prefix}-${fy}-${seq}`;
}

import mongoose from "mongoose";

const invoiceSequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.InvoiceSequence ||
  mongoose.model("InvoiceSequence", invoiceSequenceSchema);

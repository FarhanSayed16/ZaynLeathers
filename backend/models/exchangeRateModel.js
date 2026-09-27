import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: { type: String, default: "INR" },
  rates: {
    USD: { type: Number, default: 0 },
    GBP: { type: Number, default: 0 },
    CAD: { type: Number, default: 0 },
  },
  lastUpdated: { type: Date, default: Date.now },
});

const exchangeRateModel =
  mongoose.models.exchangeRate || mongoose.model("exchangeRate", exchangeRateSchema);

export default exchangeRateModel;

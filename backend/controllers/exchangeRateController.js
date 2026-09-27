import exchangeRateModel from "../models/exchangeRateModel.js";
import axios from "axios";

// Function to get rates from DB or fetch new ones if older than 24 hours
const getExchangeRates = async (req, res) => {
  try {
    let rateData = await exchangeRateModel.findOne({ baseCurrency: "INR" });
    const now = new Date();

    // If no rates exist or they are older than 24 hours (24 * 60 * 60 * 1000 ms), fetch new ones
    if (!rateData || now.getTime() - new Date(rateData.lastUpdated).getTime() > 86400000) {
      console.log("Fetching fresh exchange rates...");
      // Using a free API that doesn't require an API key and has INR as base (implicitly by calculating)
      // https://open.er-api.com/v6/latest/INR
      const response = await axios.get("https://open.er-api.com/v6/latest/INR");
      
      if (response.data && response.data.result === "success") {
        const rates = response.data.rates;
        
        const newRates = {
          USD: rates.USD,
          GBP: rates.GBP,
          CAD: rates.CAD,
        };

        if (rateData) {
           rateData.rates = newRates;
           rateData.lastUpdated = now;
           await rateData.save();
        } else {
           rateData = new exchangeRateModel({
             baseCurrency: "INR",
             rates: newRates,
             lastUpdated: now
           });
           await rateData.save();
        }
      } else {
        console.error("Failed to fetch rates from API, using old/default rates if available");
      }
    }

    res.json({ success: true, rates: rateData?.rates || { USD: 0, GBP: 0, CAD: 0 } });

  } catch (error) {
    console.error("Error in getExchangeRates:", error);
    res.json({ success: false, message: error.message });
  }
};

export { getExchangeRates };

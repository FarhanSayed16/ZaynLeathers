// Supported currencies
export const CURRENCIES = {
  INR: { symbol: "₹", code: "INR", locale: "en-IN" },
  USD: { symbol: "$", code: "USD", locale: "en-US" },
  GBP: { symbol: "£", code: "GBP", locale: "en-GB" },
  CAD: { symbol: "C$", code: "CAD", locale: "en-CA" },
};

// Smart round: converts and rounds UP to nearest .99
function smartRound(rawConverted) {
  const base = Math.ceil(rawConverted);
  return base - 0.01; // e.g., 72 -> 71.99
}

// Format price with symbol: "$74.99" or "₹5,999"
export function formatPriceUtil(priceINR, targetCurrency, rates) {
  if (!priceINR || isNaN(priceINR)) return priceINR;
  
  // Clean up if it's passed as a string
  const numPrice = Number(priceINR);

  if (targetCurrency === "INR") {
    return `${CURRENCIES.INR.symbol}${numPrice.toLocaleString("en-IN")}`;
  }

  const rate = rates[targetCurrency];
  // If rate is not loaded yet or invalid, fallback to INR
  if (!rate || rate <= 0) {
    return `${CURRENCIES.INR.symbol}${numPrice.toLocaleString("en-IN")}`;
  }

  const raw = numPrice * rate;
  const rounded = smartRound(raw);
  const { symbol, locale } = CURRENCIES[targetCurrency];
  
  return `${symbol}${rounded.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

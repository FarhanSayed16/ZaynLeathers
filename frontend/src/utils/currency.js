// Supported display currencies.
// Product prices in WooCommerce are stored in INR.
// The shop converts for display; checkout is still charged in INR.
export const CURRENCIES = {
  INR: { symbol: "₹", code: "INR", locale: "en-IN" },
  USD: { symbol: "$", code: "USD", locale: "en-US" },
  GBP: { symbol: "£", code: "GBP", locale: "en-GB" },
  CAD: { symbol: "C$", code: "CAD", locale: "en-CA" },
};

export const DEFAULT_CURRENCY = "USD";

// Smart round: converts and rounds UP to nearest .99
function smartRound(rawConverted) {
  const base = Math.ceil(rawConverted);
  return base - 0.01; // e.g., 72 -> 71.99
}

// Format a stored INR price for the selected display currency.
export function formatPriceUtil(priceINR, targetCurrency, rates) {
  if (priceINR == null || priceINR === "" || isNaN(priceINR)) return priceINR;

  const numPrice = Number(priceINR);
  const currency = CURRENCIES[targetCurrency] ? targetCurrency : DEFAULT_CURRENCY;

  if (currency === "INR") {
    return `${CURRENCIES.INR.symbol}${numPrice.toLocaleString("en-IN")}`;
  }

  const rate = rates?.[currency];
  if (!rate || rate <= 0) return "";

  const rounded = smartRound(numPrice * rate);
  const { symbol, locale } = CURRENCIES[currency];

  return `${symbol}${rounded.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

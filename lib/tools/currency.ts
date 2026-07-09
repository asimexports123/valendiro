export const CALCULATOR_CURRENCIES = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
] as const;

export type CalculatorCurrencyCode = (typeof CALCULATOR_CURRENCIES)[number]["code"];

export function getCurrencyMeta(code: CalculatorCurrencyCode) {
  return CALCULATOR_CURRENCIES.find((c) => c.code === code) ?? CALCULATOR_CURRENCIES[0];
}

export function formatCalculatorCurrency(
  amount: number,
  currency: CalculatorCurrencyCode
): string {
  const locale =
    currency === "INR"
      ? "en-IN"
      : currency === "EUR"
        ? "de-DE"
        : currency === "GBP"
          ? "en-GB"
          : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

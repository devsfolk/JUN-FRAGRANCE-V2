export type FxRates = Record<string, number>;

export function intlPrice(
  pkrAmount: number,
  currency: string,
  rates: FxRates,
  multiplier: number,
  bufferPercent: number
): number | null {
  const rate = rates[currency];
  if (!Number.isFinite(pkrAmount) || pkrAmount < 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const adjusted = pkrAmount * multiplier * (1 + bufferPercent / 100) * rate;
  const step = ["KWD", "OMR", "BHD"].includes(currency) ? 0.5 : 1;
  return Math.round(adjusted / step) * step;
}

export function formatMoney(amount: number, currency: string): string {
  if (currency === "PKR") return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

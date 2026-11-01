import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/site/public-data";
import { intlPrice } from "@/lib/site/intl-pricing";

type CountrySetting = { currency?: string; enabled?: boolean; shipping_pkr?: number | null };

export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
    "X-Robots-Tag": "noindex",
  };
  const query = new URL(request.url).searchParams;
  const currency = query.get("currency") ?? "";
  const rawAmounts = query.get("amounts") ?? query.get("amount");
  if (!rawAmounts || rawAmounts.split(",").some((value) => value.trim() === "")) return NextResponse.json({ error: "Price unavailable" }, { status: 400, headers });
  const amounts = rawAmounts.split(",").map(Number);
  if (amounts.length < 1 || amounts.length > 20 || amounts.some((amount) => !Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) return NextResponse.json({ error: "Price unavailable" }, { status: 400, headers });

  const settings = await getPublicSettings();
  const parse = (key: string, fallback: unknown) => {
    try { return settings[key as keyof typeof settings] ? JSON.parse(settings[key as keyof typeof settings]!) : fallback; }
    catch { return fallback; }
  };
  const enabled = parse("intl_enabled", false) === true || parse("intl_enabled", false) === "true";
  const countries = parse("intl_countries", []) as CountrySetting[];
  const country = Array.isArray(countries) ? countries.find((entry) => entry.enabled && entry.shipping_pkr != null && entry.currency === currency) : undefined;
  if (!enabled || !country || !/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "Price unavailable" }, { status: 404, headers });
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/PKR", { next: { revalidate: 43200 } });
    if (!response.ok) throw new Error("rate source unavailable");
    const data = await response.json() as { result?: string; base_code?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    const rate = data.result === "success" && data.base_code === "PKR" ? data.rates?.[currency] : undefined;
    if (!Number.isFinite(rate) || !rate) throw new Error("rate missing");
    const multiplier = Number(settings.intl_multiplier) || 10;
    const buffer = Number(settings.intl_fx_buffer_percent) || 0;
    const prices = amounts.map((amount) => intlPrice(amount, currency, { [currency]: rate }, multiplier, buffer));
    if (prices.some((price) => price === null)) throw new Error("price unavailable");
    return NextResponse.json({ currency, amounts: prices, ...(amounts.length === 1 ? { amount: prices[0] } : {}), updated: data.time_last_update_utc ?? null }, { headers });
  } catch {
    return NextResponse.json({ error: "Price confirmed on WhatsApp" }, { status: 503, headers });
  }
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/site/intl-pricing";
import { createInternationalOrderMessage } from "@/lib/site/intl-order-message";
import { whatsappLink } from "@/lib/site/whatsapp";

export type IntlCountry = { code: string; name: string; currency: string; enabled: boolean; shipping_pkr: number | null; delivery_days_text: string; note: string };
type IntlContextValue = { enabled: boolean; country: IntlCountry; countries: IntlCountry[]; selectCountry: (code: string) => void; quote: (amount: number) => Promise<number | null>; quoteMany: (amounts: number[]) => Promise<number[] | null>; money: (amount: number) => string };
const Context = createContext<IntlContextValue | null>(null);
const quoteCache = new Map<string, Promise<number | null>>();
const pakistan: IntlCountry = { code: "PK", name: "Pakistan", currency: "PKR", enabled: true, shipping_pkr: null, delivery_days_text: "", note: "" };

export function IntlProvider({ enabled, countries, children }: { enabled: boolean; countries: IntlCountry[]; children: React.ReactNode }) {
  const [code, setCode] = useState("PK");
  const [suggestion, setSuggestion] = useState<IntlCountry | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = localStorage.getItem("jf_country_v1"); if (saved && (saved === "PK" || countries.some((c) => c.code === saved && c.enabled))) setCode(saved); } catch { /* Storage may be unavailable. */ } }, 0); return () => window.clearTimeout(timer); }, [countries]);
  const country = code === "PK" ? pakistan : countries.find((c) => c.code === code && c.enabled) ?? pakistan;
  const selectCountry = useCallback((next: string) => { const valid = next === "PK" || countries.some((c) => c.enabled && c.code === next); if (!valid) return; setCode(next); try { localStorage.setItem("jf_country_v1", next); } catch { /* Storage may be unavailable. */ } }, [countries]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const idle = window.setTimeout(async () => {
      try {
        if (localStorage.getItem("jf_country_v1") || localStorage.getItem("jf_country_suggestion_v1")) return;
        const response = await fetch("/api/geo", { cache: "no-store" });
        const result = await response.json() as { country?: string | null };
        const match = countries.find((item) => item.code === result.country && item.enabled);
        if (active && match) setSuggestion(match);
      } catch { /* Geo suggestion is optional. */ }
    }, 1200);
    return () => { active = false; window.clearTimeout(idle); };
  }, [enabled, countries]);
  const dismissSuggestion = (switchTo: boolean) => {
    try { localStorage.setItem("jf_country_suggestion_v1", "dismissed"); } catch { /* Storage may be unavailable. */ }
    if (switchTo && suggestion) selectCountry(suggestion.code);
    setSuggestion(null);
  };
  const quote = useCallback((amount: number) => {
    const key = `${country.currency}:${amount}`;
    if (quoteCache.has(key)) return quoteCache.get(key)!;
    const request = fetch(`/api/fx?currency=${encodeURIComponent(country.currency)}&amount=${encodeURIComponent(amount)}`).then(async (res) => res.ok ? (await res.json() as { amount?: number }).amount ?? null : null).catch(() => null);
    quoteCache.set(key, request);
    return request;
  }, [country.currency]);
  const quoteMany = useCallback(async (amounts: number[]) => {
    if (amounts.length < 1 || amounts.length > 20) return null;
    try {
      const query = new URLSearchParams({ currency: country.currency, amounts: amounts.join(",") });
      const response = await fetch(`/api/fx?${query}`);
      if (!response.ok) return null;
      const result = await response.json() as { amounts?: number[] };
      return Array.isArray(result.amounts) && result.amounts.length === amounts.length ? result.amounts : null;
    } catch { return null; }
  }, [country.currency]);
  const value = useMemo(() => ({ enabled, country, countries: countries.filter((c) => c.enabled), selectCountry, quote, quoteMany, money: (amount: number) => formatMoney(amount, country.currency) }), [enabled, country, countries, selectCountry, quote, quoteMany]);
  return <Context.Provider value={value}>{children}{suggestion ? <aside className="fixed bottom-3 left-3 right-3 z-[60] mx-auto max-w-lg rounded-xl border border-white/15 bg-ink p-4 text-bone shadow-xl"><p className="text-sm">Looks like you are in {suggestion.name}. Show prices for delivery to {suggestion.name} in {suggestion.currency}?</p><div className="mt-3 flex gap-2"><button className="min-h-11 rounded-full bg-gold px-4 text-xs font-semibold text-ink" onClick={() => dismissSuggestion(true)} type="button">Switch</button><button className="min-h-11 rounded-full border border-white/25 px-4 text-xs" onClick={() => dismissSuggestion(false)} type="button">Stay in Pakistan</button></div></aside> : null}</Context.Provider>;
}

export function useIntlStore() { const value = useContext(Context); if (!value) throw new Error("IntlProvider is missing"); return value; }

export function useIntlProductHref(input: { title: string; sizeMl: number; slug: string; price: number; qty: number; siteUrl: string; whatsappNumber: string | null; fallbackHref: string | null; gift?: { gift: boolean; message: string; recipient: string }; giftIncludesCard?: boolean; giftWrapPricePkr?: number | null }) {
  const { enabled, country, quoteMany } = useIntlStore();
  const [result, setResult] = useState<{ key: string; href: string | null } | null>(null);
  const key = JSON.stringify([country.code, input.qty, input.price, input.slug, input.gift, input.giftIncludesCard, input.giftWrapPricePkr]);
  useEffect(() => {
    let active = true;
    if (!enabled || country.code === "PK" || !country.shipping_pkr || !input.whatsappNumber) return;
    createInternationalOrderMessage({ country: country.name, currency: country.currency, items: [{ title: input.title, quantity: input.qty, pkrAmount: input.price * input.qty, url: `${input.siteUrl.endsWith("/") ? input.siteUrl.slice(0, -1) : input.siteUrl}/shop/${input.slug}` }], shippingPkr: country.shipping_pkr, quoteMany, gift: input.gift, includesCard: input.giftIncludesCard, giftWrapPricePkr: input.giftWrapPricePkr })
      .then((message) => { if (active) setResult({ key, href: message ? whatsappLink(input.whatsappNumber, message) : null }); });
    return () => { active = false; };
  }, [enabled, country.code, country.name, country.currency, country.shipping_pkr, input.title, input.qty, input.price, input.slug, input.siteUrl, input.whatsappNumber, input.gift, input.gift?.gift, input.gift?.message, input.gift?.recipient, input.giftIncludesCard, input.giftWrapPricePkr, quoteMany, key]);
  if (!enabled || country.code === "PK") return input.fallbackHref;
  return result?.key === key ? result.href : null;
}

export function CountrySelector() {
  const { enabled, country, countries, selectCountry } = useIntlStore();
  const [open, setOpen] = useState(false);
  if (!enabled) return null;
  return <>
    <button className="min-h-11 rounded-full px-2 text-[10px] font-semibold tracking-wide text-bone hover:text-gold" type="button" onClick={() => setOpen(true)} aria-label="Choose delivery country">{country.code} · {country.currency}</button>
    {open ? <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 text-slate-900 sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="deliver-title"><div className="flex items-center justify-between"><h2 id="deliver-title" className="text-lg font-semibold">Deliver to</h2><button className="min-h-11 min-w-11" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div><div className="mt-3 space-y-1"><button className="min-h-11 w-full text-left" type="button" onClick={() => { selectCountry("PK"); setOpen(false); }}>Pakistan · PKR</button>{countries.map((c) => <button className="min-h-11 w-full text-left" key={c.code} type="button" onClick={() => { selectCountry(c.code); setOpen(false); }}>{c.name} · {c.currency}</button>)}</div><p className="mt-4 text-xs leading-relaxed text-slate-600">Perfume can need special courier handling for international parcels. We confirm availability on WhatsApp before you pay.</p><p className="mt-2 text-xs text-slate-500">Rates by <a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Exchange Rate API</a>.</p></section></div> : null}
  </>;
}

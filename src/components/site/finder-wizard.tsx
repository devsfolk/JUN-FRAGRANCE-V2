"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ProductCard } from "@/components/site/ui/product-card";
import { scoreFinderProducts, type FinderAnswers } from "@/lib/site/finder-scoring";
import { scentFamilies, scentOccasions, scentStrengths } from "@/lib/site/scent-profile";
import type { FinderProduct } from "@/lib/site/public-data";

const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Other"];
const defaults: FinderAnswers = { gender: "unisex", occasion: "day", city: "Karachi", weather: "mild", sweat: "low", day: "mixed", styles: [], strength: "moderate" };
const steps = ["Your brief", "Weather", "Your day", "Style", "Strength"];
const storageKey = "jf_finder_v1";
const subscribeAnswers = (onChange: () => void) => { window.addEventListener("storage", onChange); window.addEventListener("jf-finder-change", onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener("jf-finder-change", onChange); }; };
const getStoredAnswers = () => localStorage.getItem(storageKey) ?? "";
function parseStoredAnswers(raw: string): FinderAnswers {
  try { const parsed = JSON.parse(raw) as Partial<FinderAnswers>; return { ...defaults, ...parsed, styles: Array.isArray(parsed.styles) ? parsed.styles.slice(0, 3) : [] }; } catch { return defaults; }
}
function Choice<T extends string>({ label, value, selected, onSelect }: { label: string; value: T; selected: T; onSelect: (value: T) => void }) {
  return <button aria-pressed={value === selected} className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${value === selected ? "border-gold bg-gold/15 text-bone" : "border-white/20 text-bone/75 hover:border-gold/60"}`} onClick={() => onSelect(value)} type="button">{label}</button>;
}

export function FinderWizard({ products, whatsappNumber, siteUrl }: { products: FinderProduct[]; whatsappNumber: string | null; siteUrl: string }) {
  const savedAnswers = useSyncExternalStore(subscribeAnswers, getStoredAnswers, () => "");
  const answers = useMemo(() => parseStoredAnswers(savedAnswers), [savedAnswers]);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const persistAnswers = (value: FinderAnswers) => { try { localStorage.setItem(storageKey, JSON.stringify(value)); window.dispatchEvent(new Event("jf-finder-change")); } catch { /* Storage may be unavailable. */ } };
  const update = <K extends keyof FinderAnswers>(key: K, value: FinderAnswers[K]) => persistAnswers({ ...answers, [key]: value });
  const matches = useMemo(() => scoreFinderProducts(products, answers).filter((match) => match.score >= 5).slice(0, 3), [products, answers]);
  const toggleStyle = (family: (typeof scentFamilies)[number]) => update("styles", answers.styles.includes(family) ? answers.styles.filter((item) => item !== family) : answers.styles.length < 3 ? [...answers.styles, family] : answers.styles);
  const next = () => { if (step < steps.length - 1) setStep((value) => value + 1); else setComplete(true); };
  const reset = () => { persistAnswers(defaults); setStep(0); setComplete(false); };
  const advice = answers.weather === "hot-humid" && answers.sweat === "high"
    ? ["Consider lighter fresh, citrus or aquatic styles.", "Apply to clean, dry skin or lightly on clothes.", "Very heavy or dense styles can feel stronger in heat."]
    : answers.weather.startsWith("hot")
      ? ["Consider a lighter style for warm conditions.", "Apply to clean, dry skin or lightly on clothes.", "Try a small number of sprays first and adjust to preference."]
      : answers.weather === "cold"
        ? ["Your preferred style and strength are useful starting points.", "Apply to clean, dry skin or lightly on clothes.", "Try a small number of sprays first and adjust to preference."]
        : ["Start with the style and strength you enjoy.", "Apply to clean, dry skin or lightly on clothes.", "Try a small number of sprays first and adjust to preference."];
  return <section className="mt-10 rounded-2xl border border-white/10 bg-ink-2/80 p-4 pb-24 sm:p-7" aria-label="Perfume finder questionnaire">
    {!complete ? <>
      <div className="mb-6"><p className="text-sm text-mute">Step {step + 1} of {steps.length}: {steps[step]}</p><div aria-label={`Step ${step + 1} of ${steps.length}`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold transition-[width]" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
      {step === 0 ? <fieldset className="space-y-6"><legend className="font-serif text-xl text-bone">Who is this for, and when?</legend><div><p className="mb-2 text-sm text-mute">Gender</p><div className="flex flex-wrap gap-2">{(["men", "women", "unisex"] as const).map((value) => <Choice key={value} label={value} value={value} selected={answers.gender} onSelect={(x) => update("gender", x)} />)}</div></div><div><p className="mb-2 text-sm text-mute">Occasion</p><div className="flex flex-wrap gap-2">{scentOccasions.map((value) => <Choice key={value} label={value} value={value} selected={answers.occasion} onSelect={(x) => update("occasion", x)} />)}</div></div></fieldset> : null}
      {step === 1 ? <fieldset className="space-y-6"><legend className="font-serif text-xl text-bone">What weather do you usually wear it in?</legend><label className="grid max-w-sm gap-2 text-sm text-mute">City<select className="min-h-11 rounded border border-white/20 bg-ink px-3 text-bone" onChange={(e) => update("city", e.target.value)} value={answers.city}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label><div><p className="mb-2 text-sm text-mute">Weather</p><div className="flex flex-wrap gap-2">{([["mild", "Mild"], ["hot-dry", "Hot and dry"], ["hot-humid", "Hot and humid"], ["cold", "Cold"]] as const).map(([value, label]) => <Choice key={value} label={label} value={value} selected={answers.weather} onSelect={(x) => update("weather", x)} />)}</div></div></fieldset> : null}
      {step === 2 ? <fieldset className="space-y-6"><legend className="font-serif text-xl text-bone">Tell us about your day</legend><div><p className="mb-2 text-sm text-mute">Sweat level</p><div className="flex flex-wrap gap-2">{(["low", "medium", "high"] as const).map((value) => <Choice key={value} label={value} value={value} selected={answers.sweat} onSelect={(x) => update("sweat", x)} />)}</div></div><div><p className="mb-2 text-sm text-mute">Most of your day</p><div className="flex flex-wrap gap-2">{([["ac", "Mostly AC"], ["mixed", "Mixed"], ["outdoors", "Mostly outdoors"]] as const).map(([value, label]) => <Choice key={value} label={label} value={value} selected={answers.day} onSelect={(x) => update("day", x)} />)}</div></div></fieldset> : null}
      {step === 3 ? <fieldset><legend className="font-serif text-xl text-bone">Which styles do you like? Choose up to three.</legend><div className="mt-4 flex flex-wrap gap-2">{scentFamilies.map((family) => <button aria-pressed={answers.styles.includes(family)} className={`min-h-11 rounded-full border px-4 text-sm ${answers.styles.includes(family) ? "border-gold bg-gold/15 text-bone" : "border-white/20 text-bone/75"}`} key={family} onClick={() => toggleStyle(family)} type="button">{family}</button>)}</div></fieldset> : null}
      {step === 4 ? <fieldset><legend className="font-serif text-xl text-bone">Which strength do you prefer?</legend><div className="mt-4 flex flex-wrap gap-2">{scentStrengths.map((value) => <Choice key={value} label={value} value={value} selected={answers.strength} onSelect={(x) => update("strength", x)} />)}</div></fieldset> : null}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-between border-t border-white/10 bg-ink/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0"><button className="min-h-11 rounded border border-white/20 px-5 text-sm text-bone disabled:opacity-40" disabled={step === 0} onClick={() => setStep((value) => value - 1)} type="button">Back</button><button className="min-h-11 rounded bg-gold px-6 text-sm font-semibold text-ink" onClick={next} type="button">{step === steps.length - 1 ? "See suggestions" : "Next"}</button></div>
    </> : <div><h2 className="font-serif text-2xl text-bone">What to look for</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-bone/75">{advice.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-4 rounded border border-white/10 p-3 text-sm text-bone/80">Perfume does not stop sweat or body odour; hygiene and antiperspirant come first.</p><h2 className="mt-9 font-serif text-2xl text-bone">Jun.fragrance picks</h2>{matches.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{matches.map(({ product, reason }) => <div key={product.id}><p className="mb-2 text-xs uppercase tracking-wide text-gold">From Jun.fragrance</p><ProductCard product={{ ...product, inspired_by: null }} whatsappNumber={whatsappNumber} siteUrl={siteUrl} /><p className="mt-2 text-xs text-bone/75">{reason}.</p></div>)}</div> : <div className="mt-3"><p className="text-sm text-bone/75">We do not have a close match for this brief</p><div className="mt-3 flex gap-4 text-sm text-gold"><Link href="/shop">Browse the shop</Link></div></div>}<h2 className="mt-9 font-serif text-2xl text-bone">Good to know</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-bone/75"><li>Preference is personal; use your answers as a starting point.</li><li>Weather, setting and application can affect how a scent feels.</li><li>Product details come from the information saved for each item.</li></ul><button className="mt-6 min-h-11 rounded border border-white/20 px-5 text-sm text-bone" onClick={reset} type="button">Start again</button></div>}
  </section>;
}

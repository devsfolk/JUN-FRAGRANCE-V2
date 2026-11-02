"use client";

import { useEffect, useMemo, useState } from "react";
import { whatsappLink } from "@/lib/site/whatsapp";
import {
  blankCustomAnswers, buildCustomWhatsAppMessage, customAlcoholOptions, customCityOptions,
  customDayOptions, customForOptions, customOccasions, customSeasonOptions, customStrengthOptions,
  customStyleOptions, customSweatOptions, customWearOptions, customWeatherOptions,
  sanitizeCustomAnswers, sanitizeCustomText, type CustomAnswers,
} from "@/lib/site/custom-request";

const storageKey = "jf_custom_v1";
const styleColors: Record<(typeof customStyleOptions)[number], string> = {
  "Fresh and citrus": "#CFE36A", Aquatic: "#4FB3D9", Woody: "#8B5A2B", Oud: "#4A2A1A", Floral: "#E58FB4",
  "Sweet and vanilla": "#F1C98A", Spicy: "#C8442B", "Musky and clean": "#E8E2D6", Fruity: "#F28C4B",
};
const stepTitles = ["Who and when", "Where and weather", "Scent preferences", "Reference and details", "Review"];

function ChoiceGroup({ legend, options, selected, onSelect }: { legend: string; options: readonly string[]; selected: string; onSelect: (value: string) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-medium text-bone">{legend}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <button aria-pressed={selected === option} className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${selected === option ? "border-gold bg-gold/15 text-bone" : "border-white/20 text-bone/75 hover:border-gold/60"}`} key={option} onClick={() => onSelect(option)} type="button">{option}</button>)}</div></fieldset>;
}

function MultiChoiceGroup({ legend, options, selected, maximum, onToggle }: { legend: string; options: readonly string[]; selected: string[]; maximum: number; onToggle: (value: string) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-medium text-bone">{legend}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <button aria-pressed={selected.includes(option)} className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${selected.includes(option) ? "border-gold bg-gold/15 text-bone" : "border-white/20 text-bone/75 hover:border-gold/60"}`} key={option} onClick={() => onToggle(option)} type="button">{option}</button>)}</div><p className="mt-1 text-xs text-mute">Choose up to {maximum}.</p></fieldset>;
}

function BottlePreview({ styles, oldStyles, previewKey }: { styles: string[]; oldStyles: string[]; previewKey: number }) {
  const gradient = (items: string[]) => {
    if (!items.length) return undefined;
    const band = 100 / items.length;
    const stops = items.map((style, index) => `${styleColors[style as keyof typeof styleColors]} ${index * band}% ${(index + 1) * band}%`).join(", ");
    return `linear-gradient(to bottom, ${stops})`;
  };
  const current = gradient(styles);
  const previous = gradient(oldStyles);
  return <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-2/70 p-3 lg:block lg:border-0 lg:bg-transparent lg:p-0">
    <div aria-hidden="true" className="relative aspect-[140/200] w-[70px] shrink-0 [container-type:inline-size] lg:aspect-[140/300] lg:w-32">
      <div className={`absolute inset-0 overflow-hidden border ${styles.length ? "border-[#C9A66B]/40" : "border-dashed border-[#C9A66B]"}`} style={{ borderRadius: "25cqw" }}>
        {current ? <div className="absolute inset-0 animate-[customBottleIn_.28s_ease-out_both] motion-reduce:animate-none" key={`current-${previewKey}`} style={{ background: current }} /> : <span className="absolute inset-0 grid place-items-center px-1 text-center text-[10px] text-gold">Your scent</span>}
        {previous ? <div className="absolute inset-0 animate-[customBottleOut_.28s_ease-out_both] motion-reduce:animate-none" key={`previous-${previewKey}`} style={{ background: previous }} /> : null}
      </div>
    </div>
    <p className="min-w-0 text-xs leading-5 text-bone/70 lg:mt-3">{styles.length ? styles.join(", ") : "Your scent"}</p>
    <style>{`@keyframes customBottleIn{from{opacity:0}to{opacity:1}}@keyframes customBottleOut{from{opacity:1}to{opacity:0}}@media(prefers-reduced-motion:reduce){.animate-\\[customBottleIn_\\.28s_ease-out_both\\],.animate-\\[customBottleOut_\\.28s_ease-out_both\\]{animation:none!important}}`}</style>
  </div>;
}

type FormSettings = { notes: string[]; bottleNameEnabled: boolean; lowAlcoholEnabled: boolean; alcoholFreeEnabled: boolean };

export function CustomFragranceForm({ whatsappNumber, settings }: { whatsappNumber: string | null; settings: FormSettings }) {
  const [answers, setAnswers] = useState<CustomAnswers>(blankCustomAnswers);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [oldStyles, setOldStyles] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const noteOptions = useMemo(() => settings.notes.slice(0, 30), [settings.notes]);
  const alcoholOptions = [customAlcoholOptions[0], ...(settings.lowAlcoholEnabled ? [customAlcoholOptions[1]] : []), ...(settings.alcoholFreeEnabled ? [customAlcoholOptions[2]] : [])];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setAnswers(sanitizeCustomAnswers(JSON.parse(saved), noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled));
      } catch { /* Ignore invalid or unavailable browser storage. */ }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify(sanitizeCustomAnswers(answers, noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled))); }
    catch { /* The request remains available even when browser storage is unavailable. */ }
  }, [answers, hydrated, noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled]);

  const update = <K extends keyof CustomAnswers>(key: K, value: CustomAnswers[K]) => setAnswers((current) => ({ ...current, [key]: value }));
  const updateText = (key: "cityOther" | "reference" | "bottleName" | "sensitivities" | "notes", value: string, max: number) => update(key, sanitizeCustomText(value, max));
  const toggle = (key: "wear" | "styles" | "avoid" | "oils", option: string, maximum: number) => {
    const selected = answers[key];
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : selected.length < maximum ? [...selected, option] : selected;
    if (key === "styles") { setOldStyles(answers.styles); setPreviewKey((value) => value + 1); }
    update(key, next);
  };
  const changeStep = (next: number) => setStep(Math.max(0, Math.min(4, next)));
  const message = useMemo(() => buildCustomWhatsAppMessage(answers, noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled), [answers, noteOptions, settings.lowAlcoholEnabled, settings.alcoholFreeEnabled]);
  const href = whatsappLink(whatsappNumber, message);
  const city = answers.city === "Other" ? answers.cityOther || "Other" : answers.city;
  const preview = <BottlePreview styles={answers.styles} oldStyles={oldStyles} previewKey={previewKey} />;

  return <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
    <div className="min-w-0 pb-28 lg:pb-0">
      <div className="mb-4 lg:hidden">{preview}</div>
      <div className="mb-5" aria-label={`Step ${step + 1} of 5`}><div className="h-px overflow-hidden bg-white/15"><div className="h-full origin-left bg-gold transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `scaleX(${(step + 1) / 5})` }} /></div><p className="mt-2 text-xs text-mute">Step {step + 1} of 5</p></div>
      <div aria-live="polite" className="sr-only">{stepTitles[step]}</div>
      <div className="animate-[customStepIn_.24s_ease-out_both] motion-reduce:animate-none" key={step}>
        {step === 0 ? <div className="space-y-6"><h2 className="font-serif text-2xl text-bone">Who and when</h2><ChoiceGroup legend="For" options={customForOptions} selected={answers.for} onSelect={(value) => update("for", value as CustomAnswers["for"])} /><ChoiceGroup legend="Occasion" options={customOccasions} selected={answers.occasion} onSelect={(value) => update("occasion", value as CustomAnswers["occasion"])} /></div> : null}
        {step === 1 ? <div className="space-y-6"><h2 className="font-serif text-2xl text-bone">Where you live, the weather and where you will wear it</h2><ChoiceGroup legend="City" options={customCityOptions} selected={answers.city} onSelect={(value) => update("city", value as CustomAnswers["city"])} />{answers.city === "Other" ? <label className="grid gap-2 text-sm text-bone">City<input className="min-h-11 rounded border border-white/20 bg-ink-2 px-3 text-base" maxLength={40} onChange={(event) => updateText("cityOther", event.target.value, 40)} value={answers.cityOther} /></label> : null}<ChoiceGroup legend="Weather" options={customWeatherOptions} selected={answers.weather} onSelect={(value) => update("weather", value as CustomAnswers["weather"])} /><ChoiceGroup legend="Sweat" options={customSweatOptions} selected={answers.sweat} onSelect={(value) => update("sweat", value as CustomAnswers["sweat"])} /><ChoiceGroup legend="Day" options={customDayOptions} selected={answers.day} onSelect={(value) => update("day", value as CustomAnswers["day"])} /><ChoiceGroup legend="Season" options={customSeasonOptions} selected={answers.season} onSelect={(value) => update("season", value as CustomAnswers["season"])} /><MultiChoiceGroup legend="Where will you wear it?" options={customWearOptions} selected={answers.wear} maximum={2} onToggle={(value) => toggle("wear", value, 2)} /></div> : null}
        {step === 2 ? <div className="space-y-6"><h2 className="font-serif text-2xl text-bone">Scent styles</h2><MultiChoiceGroup legend="Scent styles" options={customStyleOptions} selected={answers.styles} maximum={3} onToggle={(value) => toggle("styles", value, 3)} /><MultiChoiceGroup legend="Please avoid" options={customStyleOptions} selected={answers.avoid} maximum={3} onToggle={(value) => toggle("avoid", value, 3)} /><ChoiceGroup legend="Strength" options={customStrengthOptions} selected={answers.strength} onSelect={(value) => update("strength", value as CustomAnswers["strength"])} />{noteOptions.length ? <MultiChoiceGroup legend="Oils and notes you would like" options={noteOptions} selected={answers.oils} maximum={5} onToggle={(value) => toggle("oils", value, 5)} /> : null}{alcoholOptions.length > 1 ? <ChoiceGroup legend="Alcohol preference" options={alcoholOptions} selected={answers.alcohol} onSelect={(value) => update("alcohol", value as CustomAnswers["alcohol"])} /> : null}<p className="rounded-lg border border-white/10 p-3 text-sm leading-6 text-bone/70">You tell us what you prefer. Our perfumers decide the final formula and confirm it with you on WhatsApp. Exact percentages are not chosen on this website.</p></div> : null}
        {step === 3 ? <div className="space-y-5"><h2 className="font-serif text-2xl text-bone">Reference and details</h2><label className="grid gap-2 text-sm text-bone">Describe a scent you like or want it to resemble<textarea className="min-h-24 rounded border border-white/20 bg-ink-2 p-3 text-base" maxLength={120} onChange={(event) => updateText("reference", event.target.value, 120)} placeholder="For example: clean, fresh, not too sweet" value={answers.reference} /></label>{settings.bottleNameEnabled ? <label className="grid gap-2 text-sm text-bone">Name for the bottle<input className="min-h-11 rounded border border-white/20 bg-ink-2 px-3 text-base" maxLength={20} onChange={(event) => updateText("bottleName", event.target.value, 20)} value={answers.bottleName} /></label> : null}<label className="grid gap-2 text-sm text-bone">Allergies or sensitivities<input className="min-h-11 rounded border border-white/20 bg-ink-2 px-3 text-base" maxLength={80} onChange={(event) => updateText("sensitivities", event.target.value, 80)} value={answers.sensitivities} /><span className="text-xs text-mute">We cannot give medical advice; tell us what you want us to avoid.</span></label><label className="grid gap-2 text-sm text-bone">Anything else?<textarea className="min-h-24 rounded border border-white/20 bg-ink-2 p-3 text-base" maxLength={120} onChange={(event) => updateText("notes", event.target.value, 120)} value={answers.notes} /></label></div> : null}
        {step === 4 ? <div className="space-y-5"><h2 className="font-serif text-2xl text-bone">Review your request</h2><div className="space-y-3">{[
          ["Who and when", [`For: ${answers.for}`, `Occasion: ${answers.occasion}`]],
          ["Where and weather", [`City: ${city}`, `Weather: ${answers.weather}`, `Sweat: ${answers.sweat}`, `Day: ${answers.day}`, `Season: ${answers.season}`, `Wear: ${answers.wear.join(", ") || "not specified"}`]],
          ["Scent preferences", [`Scent styles: ${answers.styles.join(", ") || "not specified"}`, `Please avoid: ${answers.avoid.join(", ") || "not specified"}`, `Strength: ${answers.strength}`, `Oils and notes: ${answers.oils.join(", ") || "not specified"}`, `Alcohol: ${answers.alcohol}`]],
          ["Reference and details", [`Should smell like: ${answers.reference || "not specified"}`, `Bottle name: ${settings.bottleNameEnabled ? answers.bottleName || "none" : "not requested"}`, `Sensitivities: ${answers.sensitivities || "none"}`, `Notes: ${answers.notes || "none"}`]],
        ].map(([title, items], index) => <section className="rounded-lg border border-white/10 p-3" key={title as string}><div className="flex items-center justify-between gap-3"><h3 className="font-medium text-bone">{title as string}</h3><button className="min-h-11 px-3 text-sm text-gold underline underline-offset-4" onClick={() => changeStep(index)} type="button">Edit</button></div><ul className="space-y-1 text-sm text-bone/70">{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>{href ? <a className="flex min-h-14 items-center justify-center rounded-xl bg-[#155D3A] px-5 text-center text-base font-semibold text-white hover:bg-[#155D3A]/90" href={href} onClick={() => { try { localStorage.removeItem(storageKey); } catch { /* Ignore unavailable browser storage. */ } }} rel="noreferrer" target="_blank">Send request on WhatsApp</a> : <p className="rounded-lg border border-white/10 p-4 text-sm text-bone/75">WhatsApp is not set up yet</p>}<p className="text-sm text-bone/70">We will reply on WhatsApp to confirm the blend, price and time.</p><p className="text-xs text-mute">Message length: {message.length} / 1,800</p></div> : null}
      </div>
      {step < 4 ? <div className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-white/10 bg-ink/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0"><button className="min-h-11 rounded border border-white/20 px-5 text-sm text-bone disabled:opacity-40" disabled={step === 0 || !hydrated} onClick={() => changeStep(step - 1)} type="button">Back</button><button className="min-h-11 rounded bg-gold px-6 text-sm font-semibold text-ink disabled:opacity-50" disabled={!hydrated} onClick={() => changeStep(step + 1)} type="button">Next</button></div> : null}
    </div>
    <aside className="sticky top-24 hidden h-fit lg:block">{preview}</aside>
    <style>{`@keyframes customStepIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.animate-\\[customStepIn_\\.24s_ease-out_both\\]{animation:none!important}}`}</style>
  </div>;
}

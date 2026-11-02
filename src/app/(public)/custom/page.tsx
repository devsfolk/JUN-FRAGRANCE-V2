import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { CustomFragranceForm } from "@/components/site/custom-fragrance-form";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/site/json-ld";
import { getPageSEO, getPublicSettings, parseCustomFragranceSettings } from "@/lib/site/public-data";
import { pageAlternates } from "@/lib/site/metadata";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 60;
const defaultTitle = "Custom Perfume Made for You, Pakistan";
const defaultDescription = "Describe a fragrance for Pakistan. Share your preferences on WhatsApp to confirm the blend, price and time.";

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("custom");
  const title = pageSeo?.seo_title?.trim() || defaultTitle;
  const description = pageSeo?.seo_description?.trim() || defaultDescription;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  return { title, description, alternates: pageAlternates("/custom"), openGraph: { title, description, url: `${siteUrl}/custom`, siteName: "Jun.fragrance", locale: "en_PK", type: "website" } };
}

export default async function CustomFragrancePage() {
  const rawSettings = await getPublicSettings();
  const settings = parseCustomFragranceSettings(rawSettings);
  if (!settings.enabled) notFound();
  const whatsappNumber = extractWhatsappNumber(rawSettings);
  const startingPrice = settings.priceFrom === null ? null : `Custom fragrances start at Rs. ${settings.priceFrom.toLocaleString("en-PK")} for 50 ml.`;
  const leadTime = settings.leadTime ? `Usual time: ${settings.leadTime}.` : null;
  const priceAndTimeFallback = !startingPrice || !leadTime ? "Price and time are confirmed on WhatsApp." : null;
  const returnNote = settings.returnNote || "Return and exchange terms for custom perfumes are confirmed on WhatsApp before you pay.";
  const faqs = [
    { question: "How does a custom fragrance work?", answer: "Tell us who it is for, where you live, the weather and scent styles you prefer. Send the brief on WhatsApp; our team confirms the blend, price and time with you there." },
    { question: "Can you copy a perfume exactly?", answer: "We make a scent in a similar style to what you describe. We cannot promise an exact match to any existing perfume." },
    { question: "What does it cost?", answer: startingPrice ? `${startingPrice} The final price is confirmed on WhatsApp.` : "Price and time are confirmed on WhatsApp." },
    { question: "How long does it take?", answer: leadTime ? `${leadTime} The time is confirmed on WhatsApp.` : "Price and time are confirmed on WhatsApp." },
    { question: "Can I return a custom perfume?", answer: returnNote },
  ];
  const faqSchema = faqPageJsonLd(faqs);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: siteUrl }, { name: "Custom", url: `${siteUrl}/custom` }])} />
    {faqSchema ? <JsonLd data={faqSchema} /> : null}
    <section className="bg-ink pb-16 pt-28 sm:pb-24 sm:pt-36"><Container className="max-w-6xl">
      <div className="mx-auto max-w-3xl"><p className="eyebrow">Made around your brief</p><h1 className="mt-3 font-serif text-4xl text-bone sm:text-5xl">Your own fragrance</h1><p className="mt-4 text-bone/75">Tell us what you like. Our team reads your request on WhatsApp and confirms the blend with you.</p>
        <section className="mt-9"><h2 className="font-serif text-2xl text-bone">How it works</h2><ol className="mt-4 grid gap-3 sm:grid-cols-2">{["Tell us about you and the scent you want.", "Send the request on WhatsApp.", "We confirm the blend, price and time with you.", "We make it and deliver it."].map((item, index) => <li className="flex gap-3 rounded-lg border border-white/10 p-3 text-sm text-bone/75" key={item}><span className="font-semibold text-gold">{index + 1}.</span><span>{item}</span></li>)}</ol></section>
        <aside className="mt-8 space-y-2 rounded-xl border border-gold/25 bg-ink-2/70 p-4 text-sm leading-6 text-bone/75"><h2 className="font-serif text-lg text-bone">A clear note before you begin</h2><p>We make a scent in a similar style to what you describe. We cannot promise an exact match to any existing perfume.</p>{startingPrice ? <p>{startingPrice}</p> : null}{leadTime ? <p>{leadTime}</p> : null}{priceAndTimeFallback ? <p>{priceAndTimeFallback}</p> : null}<p>{returnNote}</p></aside>
      </div>
      <div className="mx-auto mt-10 max-w-5xl"><CustomFragranceForm whatsappNumber={whatsappNumber} settings={{ notes: settings.notes, bottleNameEnabled: settings.bottleNameEnabled, lowAlcoholEnabled: settings.lowAlcoholEnabled, alcoholFreeEnabled: settings.alcoholFreeEnabled }} /><p className="mx-auto mt-3 max-w-3xl text-center text-xs leading-5 text-mute">Your answers are only used to open a WhatsApp message to us. We do not store them on this website.</p></div>
      <div className="mx-auto mt-16 max-w-3xl border-t border-white/10 pt-8"><h2 className="font-serif text-2xl text-bone">Frequently asked questions</h2><div className="mt-5 space-y-3">{faqs.map((faq) => <details className="rounded-lg border border-white/10 p-4" key={faq.question}><summary className="cursor-pointer text-sm font-medium text-bone">{faq.question}</summary><p className="mt-3 text-sm leading-6 text-bone/70">{faq.answer}</p></details>)}</div></div>
    </Container></section>
  </>;
}

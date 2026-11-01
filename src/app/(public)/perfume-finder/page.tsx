import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/site/json-ld";
import { getFinderProducts, getPageSEO, getPublicSettings, isFinderEnabled } from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";
import { pageAlternates } from "@/lib/site/metadata";
import { FinderWizard } from "@/components/site/finder-wizard";

export const revalidate = 60;
const defaultTitle = "Perfume Finder for Pakistan's Weather";
const defaultDescription = "Explore fragrance styles by your preferences, occasion and Pakistan's weather with Jun.fragrance.";
const faqs = [
  { question: "How does the perfume finder work?", answer: "It compares your selected preferences with scent profile details saved for active products. It is a starting point for browsing." },
  { question: "Are the suggestions a guarantee of how a fragrance will feel?", answer: "No. Personal preference and circumstances vary, so use the profile information as a guide." },
  { question: "Does perfume prevent sweating or body odour?", answer: "No. Perfume does not stop sweat or body odour; hygiene and antiperspirant come first." },
  { question: "Where are my answers stored?", answer: "Your answers are kept in local browser storage on your device and are not sent to the server." },
];

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("perfume-finder");
  const title = pageSeo?.seo_title?.trim() || defaultTitle;
  const description = pageSeo?.seo_description?.trim() || defaultDescription;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  return { title, description, alternates: pageAlternates("/perfume-finder"), openGraph: { title, description, url: `${siteUrl}/perfume-finder`, siteName: "Jun.fragrance", locale: "en_PK", type: "website" } };
}

export default async function PerfumeFinderPage() {
  if (!(await isFinderEnabled())) notFound();
  const [products, settings] = await Promise.all([getFinderProducts(), getPublicSettings()]);
  if (products.length < 6) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const whatsappNumber = extractWhatsappNumber(settings);
  const faqSchema = faqPageJsonLd(faqs);
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: siteUrl }, { name: "Perfume finder", url: `${siteUrl}/perfume-finder` }])} />
    {faqSchema ? <JsonLd data={faqSchema} /> : null}
    <section className="bg-ink pb-16 pt-28 sm:pb-24 sm:pt-36"><Container><div className="mx-auto max-w-3xl"><p className="eyebrow">Find by preference</p><h1 className="mt-3 font-serif text-4xl text-bone sm:text-5xl">Perfume finder</h1><p className="mt-4 max-w-2xl text-bone/75">Share the styles and settings you prefer to see a few Jun.fragrance options that match their saved profiles.</p><h2 className="mt-9 font-serif text-2xl text-bone">How it works</h2><p className="mt-2 text-sm leading-7 text-bone/70">Choose who the fragrance is for, your occasion, typical weather, daily setting, preferred styles and strength. Suggestions use those answers and the product profile details. Your answers stay in this browser.</p><FinderWizard products={products} whatsappNumber={whatsappNumber} siteUrl={siteUrl} /><div className="mt-14 border-t border-white/10 pt-8"><h2 className="font-serif text-2xl text-bone">Frequently asked questions</h2><div className="mt-5 space-y-5">{faqs.map((faq) => <section key={faq.question}><h3 className="font-medium text-bone">{faq.question}</h3><p className="mt-1 text-sm leading-6 text-bone/70">{faq.answer}</p></section>)}</div></div></div></Container></section>
  </>;
}

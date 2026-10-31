import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { ProductCard } from "@/components/site/ui/product-card";
import { getFeaturedPicks, getPageSEO, getPublicSettings } from "@/lib/site/public-data";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import { whatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 60;
const questions = [
  { question: "Can I send a perfume as a gift?", answer: "Yes. Switch on ‘This is a gift’ before sending your order on WhatsApp." },
  { question: "Will the price be shown on the parcel?", answer: "Prices are not shown on the parcel or paperwork." },
  { question: "Can I add recipient details?", answer: "Send the recipient details in the WhatsApp order chat." },
  { question: "What is included with a gift?", answer: "The Jun.fragrance box is included. A message card or gift bag is included only when shown as included on this page." },
];

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getPageSEO("gifts"), getPublicSettings()]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = seo?.seo_title?.trim() || "Perfume Gift Delivered in Pakistan";
  const description = seo?.seo_description?.trim() || "Send a Jun.fragrance perfume as a gift. Choose a perfume or bundle, add recipient details on WhatsApp, and request dispatch without prices on the parcel.";
  return { title, description, alternates: { canonical: `${siteUrl}/gifts` }, openGraph: { title, description, url: `${siteUrl}/gifts`, siteName: "Jun.fragrance", locale: "en_PK", type: "website", ...(seo?.og_image_url ? { images: [seo.og_image_url] } : {}) }, robots: settings.gift_enabled === "false" || settings.gift_enabled === "0" ? { index: false, follow: false } : undefined };
}

export default async function GiftsPage() {
  const [settings, products] = await Promise.all([getPublicSettings(), getFeaturedPicks()]);
  if (settings.gift_enabled === "false" || settings.gift_enabled === "0") notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const images = ["gift-hero.webp", "gift-bag.webp", "gift-flatlay.webp"].filter((file) => existsSync(join(process.cwd(), "public", "gifts", file)));
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  const includesCard = settings.gift_includes_card === "true" || settings.gift_includes_card === "1";
  const includesBag = settings.gift_includes_bag === "true" || settings.gift_includes_bag === "1";
  const intlEnabled = settings.intl_enabled === "true" || settings.intl_enabled === "1";
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: siteUrl }, { name: "Gifts", url: `${siteUrl}/gifts` }])} />
    <JsonLd data={faqData} />
    <section className="bg-ink pb-14 pt-28 text-bone md:pb-20"><Container>
      <h1 className="max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Send perfume as a gift</h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-bone/70">Choose a Jun.fragrance perfume or bundle, then send the order and recipient details on WhatsApp.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((file) => <div className="relative aspect-[4/3] overflow-hidden rounded-xl" key={file}><Image src={`/gifts/${file}`} alt="Jun.fragrance gifting" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover" /></div>)}</div>
    </Container></section>
    <section className="bg-bone py-14 text-ink md:py-20"><Container>
      <h2 className="font-serif text-3xl">How it works</h2><ol className="mt-5 grid gap-4 sm:grid-cols-2">{["Choose a perfume or a bundle.", "Switch on ‘This is a gift’.", "Send the order on WhatsApp with the recipient details.", "We dispatch without prices on the parcel."].map((step, i) => <li className="rounded-xl border border-ink/10 p-5" key={step}><span className="text-xs text-gold">0{i + 1}</span><p className="mt-2 text-sm">{step}</p></li>)}</ol>
      <h2 className="mt-12 font-serif text-3xl">What is included</h2><ul className="mt-4 space-y-2 text-sm"><li>The Jun.fragrance box.</li>{includesCard ? <li>A message card.</li> : null}{includesBag ? <li>A gift bag.</li> : null}</ul>
      <p className="mt-6 text-sm">Prices are not shown on the parcel or paperwork. Delivery details are confirmed on WhatsApp.</p>{intlEnabled ? <p className="mt-2 text-sm">Perfume can need special courier handling for international parcels. We confirm availability on WhatsApp before you pay.</p> : null}
      <Link className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm text-bone" href="/bundle">Explore the perfume bundle</Link>
    </Container></section>
    <section className="border-t border-white/10 bg-ink py-14 text-bone md:py-20"><Container><h2 className="font-serif text-3xl">Choose a gift</h2><div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">{products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber(settings)} siteUrl={siteUrl} />)}</div></Container></section>
    <section className="bg-bone py-14 text-ink"><Container><h2 className="font-serif text-3xl">Gift order questions</h2><div className="mt-5 divide-y divide-ink/10">{questions.map((item) => <details className="py-4" key={item.question}><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-2 text-sm leading-6 text-ink/70">{item.answer}</p></details>)}</div></Container></section>
  </>;
}

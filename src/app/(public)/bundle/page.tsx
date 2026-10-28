import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { Price } from "@/components/site/ui/price";
import { BundlePicker } from "@/components/site/bundle-picker";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import {
  getBundleProducts,
  getBundleSettings,
  getPageSEO,
  getPublicSettings,
} from "@/lib/site/public-data";
import { whatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [bundleSettings, pageSeo] = await Promise.all([
    getBundleSettings(),
    getPageSEO("bundle"),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const defaultPoster = bundleSettings.imageUrl || `${siteUrl}/bundle/bundle-poster.webp`;
  const formattedPrice = bundleSettings.price.toLocaleString("en-PK");

  const title =
    pageSeo?.seo_title?.trim() ||
    `Build Your Own 3 Perfume Bundle, Rs. ${formattedPrice} | Jun.fragrance`;

  const description =
    pageSeo?.seo_description?.trim() ||
    `Choose any 3 perfumes across Pakistan for Rs. ${formattedPrice} and order instantly via WhatsApp with Jun.fragrance.`;

  const ogImage = pageSeo?.og_image_url?.trim() || defaultPoster;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/bundle` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/bundle`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: [{ url: ogImage }],
    },
  };
}

export default async function BundlePage() {
  const bundleSettings = await getBundleSettings();
  if (!bundleSettings.enabled) {
    notFound();
  }

  const [products, settings] = await Promise.all([
    getBundleProducts(),
    getPublicSettings(),
  ]);

  const number = whatsappNumber(settings);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const posterSrc = bundleSettings.imageUrl || "/bundle/bundle-poster.webp";
  const absolutePosterUrl = posterSrc.startsWith("http")
    ? posterSrc
    : `${siteUrl}${posterSrc}`;

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Bundle", url: `${siteUrl}/bundle` },
  ];

  // Product structured data for Google Shopping / Rich Results
  const bundleProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Any 3 perfumes bundle",
    description: `Pick any 3 perfumes for Rs. ${bundleSettings.price.toLocaleString("en-PK")}. Crafted in Pakistan, ordered through WhatsApp.`,
    image: absolutePosterUrl,
    offers: {
      "@type": "Offer",
      price: bundleSettings.price,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/bundle`,
    },
  };

  return (
    <div className="min-h-screen bg-ink pb-24 pt-8 md:pt-12">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={bundleProductJsonLd} />

      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Bundle</span>
        </nav>

        {/* Header Intro */}
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">
            Custom Fragrance Trio
          </p>
          <h1 className="font-serif text-3xl font-normal leading-tight text-bone sm:text-4xl md:text-5xl">
            Build your own bundle
          </h1>
          <p className="mt-2 text-sm text-bone/80 sm:text-base">
            Pick any 3 perfumes for{" "}
            <Price value={bundleSettings.price} className="font-semibold text-gold" />.
          </p>
        </div>

        {/* Compact Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-surface/50 shadow-xl">
          <div className="relative aspect-[16/7] sm:aspect-[21/8] w-full">
            <Image
              src={posterSrc}
              alt="Build your own bundle"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1152px"
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* Interactive Picker */}
        <BundlePicker
          products={products}
          bundlePrice={bundleSettings.price}
          whatsappNumber={number}
          siteUrl={siteUrl}
        />
      </Container>
    </div>
  );
}

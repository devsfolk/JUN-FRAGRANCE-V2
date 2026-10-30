import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/container";
import { Price } from "@/components/site/ui/price";
import { BundlePicker } from "@/components/site/bundle-picker";
import { JournalPlacement } from "@/components/site/journal-placement";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import {
  getBundleProducts,
  getBundleSettings,
  getPageSEO,
  getPublicSettings,
} from "@/lib/site/public-data";
import { whatsappNumber } from "@/lib/site/whatsapp";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [bundleSettings, pageSeo] = await Promise.all([
    getBundleSettings(),
    getPageSEO("bundle"),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const defaultPoster = bundleSettings.imageUrl || `${siteUrl}/bundle/bundle-poster-new.webp`;
  const formattedPrice = bundleSettings.price.toLocaleString("en-PK");

  const title =
    pageSeo?.seo_title?.trim() ||
    `Build Your Own 3 Perfume Bundle, Rs. ${formattedPrice}`;

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
  const posterSrc = bundleSettings.imageUrl || "/bundle/bundle-poster-new.webp";
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

        {/* Intro banner: full-bleed poster cover with dark gradient overlay, HTML text */}
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl">
          <div className="relative flex min-h-[340px] w-full flex-col justify-end p-6 sm:min-h-[380px] sm:p-10 md:min-h-[420px] md:p-12">
            <Image
              src={posterSrc}
              alt="Build your own trio"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) calc(100vw - 4rem), 78rem"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/30" />

            <div className="relative z-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-gold">
                BUNDLE
              </p>
              <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl md:text-5xl">
                Build your own trio
              </h1>
              <p className="mt-3 text-base text-bone/90 sm:text-lg">
                Any 3 perfumes for{" "}
                <Price value={bundleSettings.price} className="font-semibold text-gold" />
              </p>

              {/* 3-step pill row */}
              <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ink/60 px-3.5 py-1.5 text-xs font-medium text-bone/90 backdrop-blur-md">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                    1
                  </span>
                  <span>Pick three</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ink/60 px-3.5 py-1.5 text-xs font-medium text-bone/90 backdrop-blur-md">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                    2
                  </span>
                  <span>Check your trio</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ink/60 px-3.5 py-1.5 text-xs font-medium text-bone/90 backdrop-blur-md">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                    3
                  </span>
                  <span>Send on WhatsApp</span>
                </div>
              </div>
            </div>
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
      <JournalPlacement placement="bundle" title="Perfume guides" />
    </div>
  );
}

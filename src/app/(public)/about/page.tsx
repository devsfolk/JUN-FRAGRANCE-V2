import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import { getPageSEO, getPublicSettings } from "@/lib/site/public-data";
import { whatsappNumber, whatsappLink } from "@/lib/site/whatsapp";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("about");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = pageSeo?.seo_title?.trim() || "Our Story | Jun.fragrance";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Learn about Jun.fragrance — a Pakistani fragrance brand crafting premium, long-lasting inspired scents for people who want to stand out.";
  const ogImage = pageSeo?.og_image_url?.trim() || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/about` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/about`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

const trustPoints = [
  {
    title: "Premium ingredients",
    description: "Finest aroma oils & natural extracts",
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: "Long lasting performance",
    description: "Rich concentration that lasts 10+ hours",
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Inspired by iconic scents",
    description: "High accuracy tribute creations",
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    title: "Crafted in Pakistan",
    description: "Proudly formulated & bottled locally",
    icon: (
      <svg aria-hidden="true" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
];

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const number = whatsappNumber(settings);
  const chat = whatsappLink(number, "Assalam o Alaikum! I would like to learn more about Jun.fragrance.");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "About", url: `${siteUrl}/about` },
  ];

  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Container className="max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">About</span>
        </nav>

        {/* Eyebrow */}
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">Our Story</p>

        {/* H1 */}
        <h1 className="font-serif text-3xl font-normal leading-[1.12] text-bone sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          Crafted for those who lead
        </h1>

        {/* Brand narrative */}
        <p className="mt-6 max-w-3xl font-serif text-xl font-normal leading-relaxed text-bone/90 sm:text-2xl md:text-3xl md:leading-[1.4]">
          Jun.fragrance was born from a simple belief: fragrance is more than a
          scent, it&apos;s a feeling. We create premium, long-lasting fragrances
          inspired by the world&apos;s most iconic scents, made for people who
          want to stand out, not blend in.
        </p>

        {/* Our Promise */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-ink-2/60 p-7">
          <h2 className="font-serif text-xl font-medium text-bone sm:text-2xl">Our Promise</h2>
          <p className="mt-3 text-sm leading-relaxed text-bone/75 sm:text-base">
            Every bottle that leaves our hands carries the same care that went into creating it.
            We are committed to quality ingredients, honest descriptions, and a fragrance experience
            that feels personal. When you wear Jun.fragrance, you carry something made with intention.
          </p>
          <p className="mt-3 text-xs text-mute">
            Jun.fragrance is an independent brand. Names in &ldquo;inspired by&rdquo; lines belong to their
            respective owners and are not affiliated with Jun.fragrance.
          </p>
        </div>

        {/* Four Trust Points */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-10 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="flex flex-col items-start rounded-xl border border-white/5 bg-ink-2/60 p-5 sm:p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                {point.icon}
              </div>
              <h3 className="font-serif text-base font-medium text-bone sm:text-lg">
                {point.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        {chat ? (
          <div className="mt-14 flex flex-col items-start gap-4 border-t border-white/10 pt-10">
            <h2 className="font-serif text-2xl font-normal text-bone">Get in touch</h2>
            <p className="text-sm text-mute">Have a question? We&apos;re happy to help on WhatsApp.</p>
            <a
              href={chat}
              id="about-whatsapp-cta"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-6 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Chat with us on WhatsApp
            </a>
          </div>
        ) : null}
      </Container>
    </div>
  );
}

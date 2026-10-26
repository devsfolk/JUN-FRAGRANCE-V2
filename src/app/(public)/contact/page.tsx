import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import { getPageSEO, getPublicSettings } from "@/lib/site/public-data";
import { whatsappNumber, whatsappLink, socialUrl } from "@/lib/site/whatsapp";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("contact");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = pageSeo?.seo_title?.trim() || "Contact Us | Jun.fragrance";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Reach out to Jun.fragrance on WhatsApp for orders, questions, or anything else. We're here to help.";
  const ogImage = pageSeo?.og_image_url?.trim() || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/contact` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/contact`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

const socialLabels: Record<string, string> = {
  social_instagram: "Instagram",
  social_tiktok: "TikTok",
  social_facebook: "Facebook",
  social_youtube: "YouTube",
};

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const number = whatsappNumber(settings);
  const chat = whatsappLink(number, "Assalam o Alaikum! I have a question about Jun.fragrance.");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Contact", url: `${siteUrl}/contact` },
  ];

  const activeSocials = (["social_instagram", "social_tiktok", "social_facebook", "social_youtube"] as const)
    .map((key) => {
      const url = settings[key] ? socialUrl(settings[key]) : null;
      return url ? { label: socialLabels[key], url } : null;
    })
    .filter((s): s is { label: string; url: string } => Boolean(s));

  const hasBusinessInfo = settings.business_city || settings.business_address || settings.business_phone_display;

  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Container className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">Contact</span>
        </nav>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">Get in touch</p>
        <h1 className="font-serif text-3xl font-normal text-bone sm:text-4xl md:text-5xl">Contact</h1>
        <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base">
          The easiest way to reach us is directly on WhatsApp. We typically respond within a few hours.
        </p>

        {/* WhatsApp CTA */}
        {chat ? (
          <a
            href={chat}
            id="contact-whatsapp-btn"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-full border border-gold/40 bg-gold/10 px-7 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Chat with us on WhatsApp
          </a>
        ) : null}

        {/* Business info */}
        {hasBusinessInfo ? (
          <address className="mt-10 not-italic rounded-2xl border border-white/10 bg-ink-2/60 p-6 text-sm text-bone/75 space-y-2">
            {settings.business_city || settings.business_address ? (
              <p>
                <span className="text-mute">Location: </span>
                {[settings.business_address, settings.business_city].filter(Boolean).join(", ")}
              </p>
            ) : null}
            {settings.business_phone_display ? (
              <p>
                <span className="text-mute">Phone: </span>
                {settings.business_phone_display}
              </p>
            ) : null}
          </address>
        ) : null}

        {/* Social links */}
        {activeSocials.length > 0 ? (
          <div className="mt-10">
            <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Follow us</h2>
            <div className="flex flex-wrap gap-3">
              {activeSocials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-xs text-bone/75 transition-colors hover:border-gold hover:text-gold"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </div>
  );
}

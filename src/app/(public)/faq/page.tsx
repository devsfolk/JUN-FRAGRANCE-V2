import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/site/json-ld";
import { getPageSEO } from "@/lib/site/public-data";

export const revalidate = 60;

const FAQ_ITEMS = [
  {
    question: "How do I place an order?",
    answer:
      "All orders are placed through WhatsApp. Simply tap the WhatsApp button on any product page or visit our Contact page, send us a message with the product name and size, and we will guide you through the process.",
  },
  {
    question: "What sizes are available?",
    answer:
      "Sizes vary by product and are displayed on each individual product page. We recommend checking the product page directly for the exact volume available.",
  },
  {
    question: "How can I reach Jun.fragrance?",
    answer:
      "The best way to reach us is on WhatsApp. You can find the chat link on our Contact page or on any product page. We aim to respond within a few hours.",
  },
  {
    question: "Are your fragrances suitable for both men and women?",
    answer:
      "Our fragrances are crafted to be enjoyed by anyone regardless of gender. Each product description provides notes and character to help you choose the right scent.",
  },
  {
    question: "What does \"inspired by\" mean?",
    answer:
      "An \"inspired by\" fragrance captures the character and spirit of a well-known scent using our own formulation. It is an independent creation by Jun.fragrance and is not affiliated with or produced by the original brand.",
  },
  {
    question: "Can I get a sample before buying a full bottle?",
    answer:
      "Please contact us on WhatsApp to ask about current sample availability. Details are confirmed when you place your enquiry.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Shipping timeframes and coverage details are confirmed on WhatsApp when you place an order, as they may vary.",
  },
  {
    question: "How should I store my fragrance?",
    answer:
      "Store your fragrance away from direct sunlight and heat, ideally in a cool, dark place such as a drawer or cabinet. Keep the cap on when not in use to preserve the scent.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("faq");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const title = pageSeo?.seo_title?.trim() || "FAQ | Jun.fragrance";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Frequently asked questions about ordering Jun.fragrance perfumes on WhatsApp, available sizes, and how to get in touch.";
  const ogImage = pageSeo?.og_image_url?.trim() || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/faq` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/faq`,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function FaqPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "FAQ", url: `${siteUrl}/faq` },
  ];

  return (
    <div className="bg-ink pb-24 pt-10 md:pt-14">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={faqPageJsonLd(FAQ_ITEMS)!} />
      <Container className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-bone">FAQ</span>
        </nav>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">Help</p>
        <h1 className="font-serif text-3xl font-normal text-bone sm:text-4xl md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base">
          Can&apos;t find your answer here? Message us on{" "}
          <Link href="/contact" className="text-gold underline underline-offset-4 hover:text-gold/80">
            WhatsApp
          </Link>
          .
        </p>

        {/* Accordion */}
        <dl className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-white/10 bg-ink-2/60 open:border-gold/30"
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-medium text-bone transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:text-base"
                id={`faq-${idx}`}
              >
                <span>{item.question}</span>
                {/* Plus / Minus icon */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-gold transition-transform group-open:rotate-45"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </span>
              </summary>
              <div className="px-5 pb-5 pt-0">
                <p className="text-sm leading-relaxed text-bone/70">{item.answer}</p>
              </div>
            </details>
          ))}
        </dl>
      </Container>
    </div>
  );
}

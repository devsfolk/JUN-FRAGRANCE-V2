import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/site/json-ld";
import { getPageSEO } from "@/lib/site/public-data";

export const revalidate = 60;

const FAQ_ITEMS = [
  {
    question: "How do I order from Jun.fragrance?",
    answer: "All orders go through WhatsApp. Pick a perfume on the shop page, then tap Order now for one bottle or Add to cart to collect several. Review your cart and send the order summary to us on WhatsApp. You can also build a three-perfume bundle on the bundle page.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "You can pay by cash on delivery or online. The website itself does not take payments.",
  },
  {
    question: "Order karne ke baad online payment kaise karun?",
    answer: "Choose online payment when you chat with us on WhatsApp. We share our account details there, and you pay from your own bank or wallet app. You can also choose cash on delivery instead.",
  },
  {
    question: "Where do you deliver and how long does it take?",
    answer: "We deliver across Pakistan. Delivery takes 3 to 5 days, and deliveries are made between 12 PM and 9 PM.",
  },
  {
    question: "Karachi se bahar delivery charges kitne hain?",
    answer: "Delivery is free within Karachi. For orders outside Karachi, the charge is between Rs. 200 and Rs. 250.",
  },
  {
    question: "What size are your perfumes and how much do they cost?",
    answer: "Every perfume is a 50 ml bottle and costs Rs. 1,999, whether it is a men's, women's or unisex scent.",
  },
  {
    question: "How does the 3-perfume bundle work?",
    answer: "Choose any three perfumes on the bundle page and the total is Rs. 4,500. Bought separately, three bottles would cost Rs. 5,997. You send the bundle to us on WhatsApp, like any other order.",
  },
  {
    question: "What is your return policy?",
    answer: "We have a 7-day return policy. Message us on WhatsApp as soon as there is a problem, and we will confirm the conditions and next steps with you there.",
  },
  {
    question: "Can I exchange a perfume?",
    answer: "Yes, exchanges are available. The customer pays the delivery charges for an exchange, even within Karachi. Message us on WhatsApp to arrange it.",
  },
  {
    question: "Perfume kitni der tak rehta hai?",
    answer: "Our perfumes last approximately 6 to 8 hours. Your skin, the heat and the number of sprays can make that shorter or longer.",
  },
  {
    question: "What does 'inspired by' mean? Are these the same as famous brands?",
    answer: "No. Our perfumes are made in scent styles that may feel familiar if you know popular fragrances, which is what 'inspired by' means. They are similar styles, not originals, and they are not made or sold by those brands. Jun.fragrance is independent, and our product names are our own.",
  },
  {
    question: "How should I store my perfume?",
    answer: "Keep the bottle in a cool, dry place away from direct sunlight and heat, with the cap closed. A drawer or a cupboard is better than a car dashboard or a sunny window.",
  },
]

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

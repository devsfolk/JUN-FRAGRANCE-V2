import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd } from "@/lib/site/json-ld";
import { getPageSEO } from "@/lib/site/public-data";
import { pageAlternates } from "@/lib/site/metadata";

export const revalidate = 60;

const faqs = [
  {
    question: "How long does delivery take?",
    answer: "Delivery across Pakistan usually takes 3 to 5 days. Deliveries are between 12 PM and 9 PM.",
  },
  {
    question: "What are the delivery charges?",
    answer: "Delivery is free in Karachi. Delivery to other cities costs Rs. 200 to 250.",
  },
  {
    question: "How do I place an order?",
    answer: "Choose a perfume, select Order now or Add to cart, send the order on WhatsApp, and we confirm the details.",
  },
  {
    question: "Which payment methods are possible, and who pays exchange delivery?",
    answer: "Cash on delivery and online payment are possible; account details are sent in the WhatsApp chat. The 7-day return policy has conditions confirmed on WhatsApp. For an exchange, the customer pays the delivery charge.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("delivery");
  const title = pageSeo?.seo_title?.trim() || "Perfume Delivery Across Pakistan";
  const description = pageSeo?.seo_description?.trim() || "See perfume delivery charges, timing and ordering details across Pakistan.";
  return { title, description, alternates: pageAlternates("/delivery") };
}

export default function DeliveryPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Delivery", url: `${siteUrl}/delivery` },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main className="bg-ink py-10 text-bone md:py-16">
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />
      <Container className="max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-mute">
          <Link href="/" className="hover:text-gold">Home</Link><span className="mx-2">/</span><span>Delivery</span>
        </nav>
        <h1 className="font-serif text-3xl sm:text-4xl">Perfume delivery across Pakistan</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-bone/80">Orders are placed on WhatsApp. Review the delivery charges and timing below before sending your order.</p>

        <section className="mt-8">
          <h2 className="font-serif text-xl">Delivery charges and time</h2>
          <p className="mt-2 text-sm leading-7 text-bone/80">Delivery is free in Karachi and costs Rs. 200 to 250 in other cities. Delivery usually takes 3 to 5 days, with deliveries between 12 PM and 9 PM.</p>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-xl">Cities</h2>
          <ul className="mt-2 list-inside list-disc text-sm leading-7 text-bone/80">
            {[
              "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
              "Peshawar", "Quetta", "Hyderabad", "Gujranwala", "Sialkot",
            ].map((city) => <li key={city}>{city}</li>)}
          </ul>
          <p className="mt-2 text-sm leading-7 text-bone/80">We deliver across Pakistan. If your city is not listed, message us on WhatsApp and we will confirm.</p>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-xl">How to order</h2>
          <ol className="mt-2 list-inside list-decimal text-sm leading-7 text-bone/80">
            <li>Choose a perfume.</li>
            <li>Select Order now or Add to cart.</li>
            <li>Send the order on WhatsApp.</li>
            <li>We confirm the details.</li>
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-xl">Payment and exchange</h2>
          <p className="mt-2 text-sm leading-7 text-bone/80">Cash on delivery and online payment are possible. Account details are sent in the WhatsApp chat. For an exchange, the customer pays the delivery charge.</p>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-xl">Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-white/10">
            {faqs.map(({ question, answer }) => (
              <div className="py-4" key={question}>
                <h3 className="text-sm font-medium">{question}</h3>
                <p className="mt-1 text-sm leading-6 text-bone/75">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <nav aria-label="Related pages" className="mt-8 flex flex-wrap gap-5 text-sm">
          <Link className="text-gold underline underline-offset-4" href="/shop">Shop perfumes</Link>
          <Link className="text-gold underline underline-offset-4" href="/bundle">Build a bundle</Link>
        </nav>
      </Container>
    </main>
  );
}

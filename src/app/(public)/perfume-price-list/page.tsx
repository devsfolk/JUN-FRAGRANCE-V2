import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/site/json-ld";
import { getPageSEO, getPriceListProducts } from "@/lib/site/public-data";
import { pageAlternates } from "@/lib/site/metadata";

export const revalidate = 60;

const faqs = [
  { question: "How much does one perfume cost?", answer: "One perfume costs Rs. 1,999 for 50 ml." },
  { question: "How much is the bundle?", answer: "Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500." },
  { question: "What are the delivery charges?", answer: "Delivery is free in Karachi and costs Rs. 200 to 250 elsewhere." },
  { question: "How do I order?", answer: "Orders are placed on WhatsApp." },
  { question: "What is the return policy?", answer: "There is a 7-day return policy; conditions are confirmed on WhatsApp." },
];

const priceFormatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 });

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await getPageSEO("price-list");
  const title = pageSeo?.seo_title?.trim() || "Perfume Price List in Pakistan, 50 ml";
  const description = pageSeo?.seo_description?.trim() || "Perfume prices in Pakistan: Rs. 1,999 for 50 ml. Browse the full list and order on WhatsApp.";
  return { title, description, alternates: pageAlternates("/perfume-price-list") };
}

export default async function PerfumePriceListPage() {
  const products = await getPriceListProducts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Perfume price list", url: `${siteUrl}/perfume-price-list` },
  ]);
  const faqJsonLd = faqPageJsonLd(faqs);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.title,
        url: new URL(`/shop/${product.slug}`, siteUrl).toString(),
      },
    })),
  };

  return (
    <main className="bg-ink py-10 text-bone md:py-16">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemListJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <Container className="max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-mute">
          <Link href="/" className="hover:text-gold">Home</Link><span className="mx-2">/</span><span>Perfume price list</span>
        </nav>
        <h1 className="font-serif text-3xl sm:text-4xl">Perfume price list in Pakistan</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-bone/80">
          One perfume costs Rs. 1,999 for 50 ml. Any 3 perfumes from the whole collection (men, women or unisex) are Rs. 4,500.
        </p>

        <section aria-label="All active perfumes" className="mt-8">
          <div className="grid gap-3 lg:hidden">
            {products.map((product) => {
              const notes = [...product.notes_top, ...product.notes_heart, ...product.notes_base].filter(Boolean);
              return (
                <article key={product.id} className="min-w-0 rounded-xl border border-white/10 bg-ink-2/60 p-4">
                  <h2 className="break-words font-serif text-lg font-medium">
                    <Link className="hover:text-gold" href={`/shop/${product.slug}`}>{product.title}</Link>
                  </h2>
                  <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="min-w-0"><dt className="text-xs text-mute">For</dt><dd className="mt-0.5 capitalize break-words">{product.gender || "—"}</dd></div>
                    <div className="min-w-0"><dt className="text-xs text-mute">Notes</dt><dd className="mt-0.5 break-words">{notes.length ? notes.join(", ") : "—"}</dd></div>
                    <div className="min-w-0"><dt className="text-xs text-mute">Size</dt><dd className="mt-0.5">{product.size_ml} ml</dd></div>
                    <div className="min-w-0"><dt className="text-xs text-mute">Price</dt><dd className="mt-0.5">Rs. {priceFormatter.format(product.price)}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-ink-2 text-xs uppercase tracking-wide text-mute">
                <tr><th className="w-[21%] p-3">Name</th><th className="w-[12%] p-3">For</th><th className="w-[43%] p-3">Main notes</th><th className="w-[10%] p-3">Size</th><th className="w-[14%] p-3">Price</th></tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((product) => {
                  const notes = [...product.notes_top, ...product.notes_heart, ...product.notes_base].filter(Boolean);
                  return <tr key={product.id}>
                    <th scope="row" className="break-words p-3 font-medium"><Link className="hover:text-gold" href={`/shop/${product.slug}`}>{product.title}</Link></th>
                    <td className="break-words p-3 capitalize">{product.gender || "—"}</td>
                    <td className="break-words p-3">{notes.length ? notes.join(", ") : "—"}</td>
                    <td className="p-3">{product.size_ml} ml</td>
                    <td className="p-3">Rs. {priceFormatter.format(product.price)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 ? <p className="mt-4 text-sm text-mute">The price list is temporarily unavailable.</p> : null}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl">Delivery</h2>
          <p className="mt-2 text-sm leading-7 text-bone/80">
            Delivery is across Pakistan in 3 to 5 days, between 12 PM and 9 PM. It is free in Karachi and costs Rs. 200 to 250 elsewhere. See <Link className="inline-flex min-h-11 items-center text-gold underline underline-offset-4" href="/delivery">delivery details</Link>.
          </p>
        </section>

        <section className="mt-10">
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
      </Container>
    </main>
  );
}

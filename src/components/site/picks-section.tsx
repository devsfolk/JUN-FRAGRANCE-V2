import Link from "next/link";
import { SectionHeading } from "./ui/section-heading";
import { Container } from "./ui/container";
import { ProductCard } from "./ui/product-card";
import { getCollectionProducts, getPublicSettings } from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export async function PicksSection() {
  const [products, rawSettings] = await Promise.all([
    getCollectionProducts(),
    getPublicSettings(),
  ]);

  if (!products || products.length === 0) {
    return null;
  }

  const number = extractWhatsappNumber(rawSettings);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  return (
    <section id="collection" className="border-t border-white/10 bg-ink py-16 md:py-24">
      <SectionHeading
        eyebrow="THE COLLECTION"
        title="Our perfumes"
        href="/shop"
        linkLabel="View all"
      />

      <Container>
        {/* Vertical grid: 2 columns on phones (no horizontal scrolling), 3 on md, 4 on xl */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.slug || product.id}
              product={product}
              whatsappNumber={number}
              siteUrl={siteUrl}
            />
          ))}
        </div>

        {/* Ghost button "View all in shop" */}
        <div className="mt-10 flex justify-center sm:mt-14">
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 bg-transparent px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            View all in shop →
          </Link>
        </div>
      </Container>
    </section>
  );
}

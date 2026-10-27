import { SectionHeading } from "./ui/section-heading";
import { Container } from "./ui/container";
import { ProductCard } from "./ui/product-card";
import { getFeaturedPicks, getPublicSettings } from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export async function PicksSection() {
  const [products, rawSettings] = await Promise.all([
    getFeaturedPicks(),
    getPublicSettings(),
  ]);

  if (!products || products.length === 0) {
    return null;
  }

  const number = extractWhatsappNumber(rawSettings);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  return (
    <section id="picks" className="border-t border-white/10 bg-ink py-16 md:py-24">
      <SectionHeading
        eyebrow="FEATURED COLLECTION"
        title="The finest picks"
        href="/shop"
        linkLabel="View all"
      />

      <Container>
        {/* Mobile: horizontal scroll-snap carousel (78vw, max 300px, next card peeking).
            Desktop: 3 cols on md, 4 cols on xl */}
        <div className="flex min-w-0 max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 overscroll-x-contain [touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch] scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.slug || product.id}
              className="w-[78vw] max-w-[300px] flex-none snap-start md:w-auto md:max-w-none flex"
            >
              <ProductCard
                product={product}
                whatsappNumber={number}
                siteUrl={siteUrl}
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

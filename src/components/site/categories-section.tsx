import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "./ui/section-heading";
import { Container } from "./ui/container";
import { getActiveCategories } from "@/lib/site/public-data";

export async function CategoriesSection() {
  const categories = await getActiveCategories();

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-ink-2 py-16 md:py-24">
      <SectionHeading
        eyebrow="SHOP BY CATEGORY"
        title="Find your scent"
        href="/shop"
        linkLabel="View all"
      />

      <Container>
        {/* Mobile: horizontal scroll-snap scroller (cards ~72vw wide, 3/4 aspect, no scrollbar).
            Desktop (md and up): 3 cols on md, 6 cols on xl grid. */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 xl:grid-cols-6">
          {categories.map((category) => {
            return (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="group relative flex aspect-[3/4] w-[72vw] max-w-[280px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-5 transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:w-auto md:max-w-none hover:border-gold/60"
              >
                {/* Background Image with slight hover scale, or subtle gold radial fallback */}
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-ink-2"
                    style={{
                      background:
                        "radial-gradient(circle at center, color-mix(in srgb, var(--color-gold) 18%, transparent) 0%, #141210 75%)",
                    }}
                  />
                )}

                {/* Dark gradient overlay for text readability */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-300 group-hover:from-black/95" />

                {/* Foreground content: Category name, description, thin gold arrow */}
                <div className="relative z-10 flex flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-2">
                    <h3 className="font-serif text-2xl font-normal text-bone transition-colors group-hover:text-gold sm:text-3xl">
                      {category.name}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="text-base text-gold transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>

                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">
                      {category.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

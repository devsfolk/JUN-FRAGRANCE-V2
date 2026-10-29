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
        {/* Mobile: CSS grid in 1 row (up to 3) or rows of 3 (aspect 3/4, gap 8px, rounded-xl).
            Desktop (md and up): 3 cols on md, 6 cols on xl grid. */}
        <div
          className="grid gap-2 [grid-template-columns:var(--mobile-cols)] md:grid-cols-3 md:gap-6 xl:grid-cols-6"
          style={
            {
              "--mobile-cols": `repeat(${Math.min(categories.length, 3)}, minmax(0, 1fr))`,
            } as React.CSSProperties
          }
        >
          {categories.map((category) => {
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-xl border border-white/10 p-2 pb-3 transition-colors hover:border-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:rounded-2xl md:p-5"
              >
                {/* Background Image with slight hover scale, or subtle gold radial fallback */}
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1280px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                {/* Foreground content: Category name (small serif 14-16px, centered on mobile), description & arrow hidden below md */}
                <div className="relative z-10 flex w-full flex-col items-center md:items-start">
                  <div className="flex w-full items-center justify-center gap-2 md:justify-between">
                    <h3 className="font-serif text-sm font-normal text-bone text-center transition-colors group-hover:text-gold sm:text-base md:text-left md:text-2xl lg:text-3xl">
                      {category.name}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="hidden text-base text-gold transition-transform duration-300 group-hover:translate-x-1 md:inline motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </div>

                  {category.description ? (
                    <p className="mt-1 hidden text-xs leading-relaxed text-mute md:line-clamp-2">
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

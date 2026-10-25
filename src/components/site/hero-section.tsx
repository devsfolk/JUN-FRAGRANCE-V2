import { Button } from "@/components/site/ui/button";
import { HeroSlides } from "./hero-slides";
import { getFeaturedHeroProducts } from "@/lib/site/public-data";

export type HeroProduct = {
  title: string;
  slug: string;
  images: string[];
  inspired_by: string | null;
  accent_color: string | null;
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
};

export async function HeroSection() {
  const products = await getFeaturedHeroProducts();

  if (!products || products.length === 0) {
    return (
      <section className="relative flex min-h-[85dvh] w-full items-center justify-center overflow-hidden bg-ink py-28">
        <div className="mist-fallback pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-site relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.32em] text-gold md:text-xs">
            JUN.FRAGRANCE
          </p>

          <h1 className="font-serif text-[2.6rem] font-normal leading-[1.08] tracking-tight text-bone sm:text-5xl md:text-7xl">
            <span>Scents that</span>{" "}
            <span className="italic block sm:inline">tell your story</span>
          </h1>

          <p className="mt-4 max-w-xl px-2 text-xs leading-relaxed text-mute sm:text-sm md:text-base">
            Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
            <Button href="/shop">Explore collection</Button>
          </div>

          <p className="mt-5 font-script text-2xl text-gold/90 sm:text-3xl">
            More than just a fragrance. It&apos;s a vibe.
          </p>
        </div>
      </section>
    );
  }

  return <HeroSlides products={products} />;
}

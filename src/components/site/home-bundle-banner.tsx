import Link from "next/link";
import Image from "next/image";
import { Container } from "./ui/container";
import { Price } from "./ui/price";
import { getBundleSettings, getFeaturedHeroProducts, getCollectionProducts } from "@/lib/site/public-data";

export async function HomeBundleBanner() {
  const [bundleSettings, heroProducts] = await Promise.all([
    getBundleSettings(),
    getFeaturedHeroProducts(),
  ]);

  if (!bundleSettings.enabled) return null;

  let trio = heroProducts.slice(0, 3);
  if (trio.length < 3) {
    const fallbackProducts = await getCollectionProducts();
    trio = fallbackProducts.slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      images: p.images,
      inspired_by: p.inspired_by,
      accent_color: p.accent_color,
      notes_top: [],
      notes_heart: [],
      notes_base: [],
      price: p.price,
      size_ml: p.size_ml,
    }));
  }

  const posterSrc = bundleSettings.imageUrl || "/bundle/bundle-poster-new.webp";

  return (
    <section id="bundle-banner" className="border-t border-white/10 bg-ink py-14 md:py-20">
      <Container className="max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-ink-2 shadow-2xl">
          {/* Subtle 25% opacity poster background */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-25">
            <Image
              src={posterSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 1152px"
              className="object-cover object-center filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/85 to-ink-2/50" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 p-6 sm:p-10 md:p-14">
            {/* Text side: appears first on phones (< lg) and left 7 cols on lg */}
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-gold">
                THE TRIO BUNDLE
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl lg:text-5xl">
                Create your own trio
              </h2>
              <p className="mt-4 font-serif text-lg text-bone/90 sm:text-xl">
                Any 3 perfumes for{" "}
                <Price value={bundleSettings.price} className="font-semibold text-gold" />
              </p>
              <p className="mt-3 text-xs sm:text-sm text-mute leading-relaxed max-w-md">
                Select your three favorite artisanal scents from our complete collection. Handcrafted in Pakistan and ordered directly on WhatsApp.
              </p>
              <div className="mt-8">
                <Link
                  href="/bundle"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink shadow-lg shadow-gold/15 transition-all duration-300 hover:bg-gold-light hover:shadow-gold/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none"
                >
                  Build your bundle →
                </Link>
              </div>
            </div>

            {/* Visual side: arches row below on phones, right 5 cols on lg */}
            <div className="relative flex justify-center lg:col-span-5 pt-4 lg:pt-0">
              {/* Thin gold hairline linking the arches */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute top-1 left-2 right-2 h-6 w-[calc(100%-1rem)] overflow-visible lg:left-4 lg:right-4 lg:w-[calc(100%-2rem)]"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M 16 18 Q 33 3 50 18 Q 67 3 84 18"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.25"
                  className="opacity-70"
                />
              </svg>

              {/* 3 Vertical Rounded Rectangles with slow staggered float */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full max-w-md">
                {trio.map((product, idx) => {
                  const imageSrc =
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : "/bundle/bundle-poster-new.webp";
                  const accent = product.accent_color || "#D4AF37";

                  // Staggered float animation configs (6s duration, transform only)
                  const animationStyle = {
                    animation: `homeTrioFloat${idx} 6s ease-in-out infinite`,
                    animationDelay: `${idx * 1.5}s`,
                  };

                  return (
                    <div
                      key={product.id || idx}
                      className="relative aspect-[140/300] w-24 sm:w-28 md:w-32 flex-1 max-w-[140px] [container-type:inline-size] rounded-[35px] [border-radius:25cqw] transition-transform motion-reduce:!animate-none motion-reduce:!transform-none"
                      style={animationStyle}
                    >
                      <div
                        className="relative h-full w-full overflow-hidden rounded-[35px] [border-radius:25cqw] border border-[#75552D] bg-ink"
                        style={{
                          boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 35%, rgba(0,0,0,0.5))`,
                        }}
                      >
                        <Image
                          src={imageSrc}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 96px, 140px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-1 right-1 text-center font-serif text-[10px] sm:text-xs font-medium text-bone/90 truncate px-1">
                          {product.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Transform-only keyframes for slow staggered float, disabled for reduced motion */}
      <style>{`
        @keyframes homeTrioFloat0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes homeTrioFloat1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
        }
        @keyframes homeTrioFloat2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="homeTrioFloat"] {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}

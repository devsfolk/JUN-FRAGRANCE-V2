import Link from "next/link";
import Image from "next/image";
import { Container } from "./ui/container";
import { Price } from "./ui/price";
import { getBundleSettings } from "@/lib/site/public-data";

export async function HomeBundleBanner() {
  const bundleSettings = await getBundleSettings();
  if (!bundleSettings.enabled) return null;

  const posterSrc = bundleSettings.imageUrl || "/bundle/bundle-poster.webp";

  return (
    <section id="bundle-banner" className="border-t border-white/10 bg-ink py-14 md:py-20">
      <Container className="max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-surface/60 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Poster Image Container - Zero Layout Shift */}
            <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square w-full overflow-hidden bg-ink/70">
              <Image
                src={posterSrc}
                alt="Create your own bundle"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover transition-transform duration-700 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
              />
            </div>

            {/* Content Column */}
            <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:p-16">
              <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-gold">
                Custom Collection
              </p>
              <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-bone sm:text-4xl lg:text-5xl">
                Create your own bundle
              </h2>
              <p className="mt-4 font-serif text-lg text-bone/90 sm:text-xl">
                Any 3 perfumes for{" "}
                <Price value={bundleSettings.price} className="font-semibold text-gold" />
              </p>
              <p className="mt-3 text-xs sm:text-sm text-mute leading-relaxed max-w-md">
                Pick your signature trio from our full fragrance catalog. Ordered easily through WhatsApp with verified details.
              </p>
              <div className="mt-8">
                <Link
                  href="/bundle"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink shadow-lg shadow-gold/10 transition-all duration-300 hover:bg-gold-light hover:shadow-gold/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none"
                >
                  Build your bundle →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

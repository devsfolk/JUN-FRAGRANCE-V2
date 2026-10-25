"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroProduct } from "./hero-section";
import { Button } from "@/components/site/ui/button";

interface HeroSlidesProps {
  products: HeroProduct[];
}

export function HeroSlides({ products }: HeroSlidesProps) {
  const [index, setIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const count = products.length;
  const current = products[index] ?? products[0];
  const accentColor = current?.accent_color?.trim() || "var(--color-gold)";

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const totalScrollable = section.offsetHeight - window.innerHeight;
        if (totalScrollable <= 0) {
          setScrollProgress(0);
          return;
        }
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
        setScrollProgress(progress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  // Scroll story note reveal calculation
  // progress 0.15 - 0.40 -> Top notes fade in
  // progress 0.40 - 0.65 -> Heart notes fade in
  // progress 0.65 - 0.90 -> Base notes fade in
  const topOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.15) / 0.2));
  const heartOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.4) / 0.2));
  const baseOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.65) / 0.2));

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ "--mist-accent": accentColor } as React.CSSProperties}
      className="relative h-[180dvh] w-full"
    >
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden transition-colors duration-700">
        {/* Layer 1 & 2: Mist Fallback Layer */}
        <div
          className="mist-fallback pointer-events-none absolute inset-0 transition-all duration-700 ease-out"
          style={{
            opacity: Math.max(0.4, 1 - scrollProgress * 0.45),
          }}
        />

        {/* Ambient Radial Accent Glow behind bottle */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-colors duration-700"
          style={{
            width: "min(70vw, 420px)",
            height: "min(70vw, 420px)",
            backgroundColor: accentColor,
            opacity: 0.18,
          }}
        />

        {/* Main Content Container */}
        <div className="container-site relative z-10 flex h-full w-full flex-col justify-between pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))]">
          {/* Top text block: Eyebrow + H1 + Subline + CTA */}
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[.32em] text-gold md:text-xs">
              JUN.FRAGRANCE
            </p>

            <h1 className="font-serif text-[2.6rem] font-normal leading-[1.08] tracking-tight text-bone sm:text-5xl md:text-7xl lg:text-7xl">
              <span>Scents that</span>{" "}
              <span className="italic block sm:inline">tell your story</span>
            </h1>

            <p className="mt-3.5 max-w-xl px-2 text-xs leading-relaxed text-mute sm:text-sm md:text-base">
              Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.
            </p>

            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/shop">Explore collection</Button>
            </div>

            <p className="mt-3 font-script text-xl text-gold/90 sm:text-2xl md:text-3xl">
              More than just a fragrance. It&apos;s a vibe.
            </p>
          </div>

          {/* Centerpiece: Bottle & Scroll Story Notes */}
          <div className="relative mx-auto my-auto flex h-[38dvh] min-h-[220px] max-h-[380px] w-full max-w-lg items-center justify-center">
            {/* Bottle Image with reserved space */}
            <div className="relative h-full w-full max-w-[260px] sm:max-w-[300px]">
              {products.map((p, idx) => {
                const isActive = idx === index;
                const imgUrl = p.images?.[0];
                return (
                  <div
                    key={p.slug || idx}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                      isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    {imgUrl ? (
                      <div className="hero-bottle relative h-full w-full">
                        <Image
                          src={imgUrl}
                          alt={p.title}
                          fill
                          priority={idx === 0}
                          sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 320px"
                          className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-36 items-center justify-center rounded-2xl border border-white/10 bg-ink-2/60 text-center text-xs text-mute backdrop-blur-sm">
                        {p.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scroll Story Notes: Top, Heart, Base groups */}
            {current && (
              <>
                {/* Top Notes (Left / Top-Left) */}
                {current.notes_top?.length > 0 && (
                  <div
                    style={{ opacity: topOpacity }}
                    className="pointer-events-none absolute left-1 sm:left-4 top-1/4 max-w-[120px] sm:max-w-[150px] transition-opacity duration-300 text-left"
                  >
                    <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                      Top Notes
                    </span>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-bone/85 leading-tight">
                      {current.notes_top.join(", ")}
                    </p>
                  </div>
                )}

                {/* Heart Notes (Right / Middle-Right) */}
                {current.notes_heart?.length > 0 && (
                  <div
                    style={{ opacity: heartOpacity }}
                    className="pointer-events-none absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 max-w-[120px] sm:max-w-[150px] transition-opacity duration-300 text-right"
                  >
                    <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                      Heart Notes
                    </span>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-bone/85 leading-tight">
                      {current.notes_heart.join(", ")}
                    </p>
                  </div>
                )}

                {/* Base Notes (Left / Bottom-Left) */}
                {current.notes_base?.length > 0 && (
                  <div
                    style={{ opacity: baseOpacity }}
                    className="pointer-events-none absolute left-1 sm:left-4 bottom-1/4 max-w-[120px] sm:max-w-[150px] transition-opacity duration-300 text-left"
                  >
                    <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                      Base Notes
                    </span>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-bone/85 leading-tight">
                      {current.notes_base.join(", ")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Bar: Product Title / Inspired By + Slide Navigation */}
          <div className="flex items-end justify-between gap-4 pt-2">
            {/* Active product caption */}
            <div className="min-w-0 max-w-[65%]">
              {current ? (
                <div>
                  <Link
                    href={`/shop/${current.slug}`}
                    className="group inline-flex items-baseline gap-2 truncate"
                  >
                    <h2 className="truncate font-serif text-lg sm:text-xl text-bone group-hover:text-gold transition-colors">
                      {current.title}
                    </h2>
                    <span className="text-[10px] text-gold opacity-0 transition-opacity group-hover:opacity-100">
                      ↗
                    </span>
                  </Link>
                  {current.inspired_by ? (
                    <p className="truncate text-[10px] sm:text-xs tracking-wide text-mute">
                      Inspired by {current.inspired_by}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Slide Navigation & Indicator */}
            {count > 1 ? (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-sans text-[11px] tracking-widest text-gold tabular-nums">
                  {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>

                {/* Desktop Prev / Next buttons with 44px min touch target */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous fragrance"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors"
                  >
                    <span aria-hidden="true" className="text-sm">←</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next fragrance"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors"
                  >
                    <span aria-hidden="true" className="text-sm">→</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

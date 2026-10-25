"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroProduct } from "./hero-section";
import { Button } from "@/components/site/ui/button";

const HeroMist = dynamic(() => import("./hero-mist"), { ssr: false });

interface HeroSlidesProps {
  products: HeroProduct[];
}

export function HeroSlides({ products }: HeroSlidesProps) {
  const [index, setIndex] = useState(0);
  const [canLoadMist, setCanLoadMist] = useState(false);
  const [hasDrawnMist, setHasDrawnMist] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const count = products.length;
  const current = products[index] ?? products[0];
  const accentColor = current?.accent_color?.trim() || "#C9A66B";

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Mount WebGL mist strictly after first paint using requestIdleCallback with 1200ms fallback
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let idleId: number | undefined;

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        idleId = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
          () => setCanLoadMist(true),
          { timeout: 1200 }
        );
      } else {
        timeoutId = setTimeout(() => setCanLoadMist(true), 1200);
      }
    }

    return () => {
      if (idleId && "cancelIdleCallback" in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Scroll listener attached ONLY when hero is visible via IntersectionObserver.
  // Updates CSS custom property --p on container directly without React state re-renders.
  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    let rafId: number;
    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const totalScrollable = section.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) {
        section.style.setProperty("--p", "0");
        return;
      }
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      section.style.setProperty("--p", progress.toFixed(4));
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", handleScroll, { passive: true });
          handleScroll();
        } else {
          window.removeEventListener("scroll", handleScroll);
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
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

  return (
    <div
      ref={containerRef}
      data-hero-container
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={
        {
          "--mist-accent": accentColor,
          "--p": "0",
        } as React.CSSProperties
      }
      className="relative h-[180dvh] w-full"
    >
      {/* Sticky Screen with contain: layout paint for smooth compositor-only updates */}
      <div
        style={{ contain: "layout paint" }}
        className="sticky top-0 flex h-dvh w-full items-center overflow-hidden transition-colors duration-700"
      >
        {/* Layer 1: Mist Fallback Layer tinted by accent color, animated via --p without React state.
            Fades out smoothly once WebGL canvas reports its first drawn frame. */}
        <div
          style={{
            willChange: "opacity",
            opacity: hasDrawnMist ? 0 : "calc(0.45 + (1 - var(--p)) * 0.55)",
            transition: "opacity 900ms ease-out",
          }}
          className="mist-fallback pointer-events-none absolute inset-0 z-0"
        />

        {/* Layer 2: WebGL Mist Canvas (mounted after first paint, z-index behind content and bottle) */}
        {canLoadMist ? (
          <HeroMist
            accentColor={accentColor}
            onFirstFrame={() => setHasDrawnMist(true)}
          />
        ) : null}

        {/* Ambient radial gradient glow (fast, no heavy blur filters) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-700"
          style={{
            width: "min(85vw, 600px)",
            height: "min(85vw, 600px)",
            background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 26%, transparent) 0%, transparent 70%)`,
          }}
        />

        {/* Main Content Layout */}
        <div className="container-site relative z-10 flex h-full w-full flex-col justify-between pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))]">
          {/* Responsive Layout Grid:
              Mobile (<lg): Vertical stack where first screen shows bottle large (~50dvh) overlapping the H1.
              Desktop (lg+): Two columns. Left: Text, CTA, tagline, controls. Right: Large bottle (~70dvh) with notes.
          */}
          <div className="my-auto grid h-full w-full items-center gap-4 lg:grid-cols-12 lg:gap-8">
            {/* Left / Top Text Column */}
            <div className="flex flex-col items-start text-left lg:col-span-5 lg:py-6">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.32em] text-gold md:text-xs">
                JUN.FRAGRANCE
              </p>

              <h1 className="font-serif text-[2.2rem] font-normal leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl lg:text-[4.25rem]">
                <span className="block">Scents that</span>
                <span className="italic block">tell your story</span>
              </h1>

              <p className="mt-2 line-clamp-2 max-w-sm text-xs leading-relaxed text-mute sm:max-w-md sm:text-sm lg:line-clamp-none lg:text-base">
                Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.
              </p>

              {/* Desktop-only placement of CTA and tagline for clean desktop column flow */}
              <div className="hidden lg:mt-8 lg:flex lg:flex-col lg:items-start lg:gap-4">
                <Button href="/shop">Explore collection</Button>
                <p className="font-script text-2xl text-gold/90">
                  More than just a fragrance. It&apos;s a vibe.
                </p>
              </div>
            </div>

            {/* Center / Right Bottle Centerpiece & Notes Column */}
            <div className="relative flex h-[48dvh] min-h-[260px] max-h-[460px] w-full items-center justify-center lg:col-span-7 lg:h-[70dvh] lg:max-h-[640px]">
              {/* Bottle Shadow (cheap radial gradient ellipse under bottle, no box-shadow/filter) */}
              <div
                className="pointer-events-none absolute bottom-4 left-1/2 h-8 w-44 -translate-x-1/2 rounded-[50%] blur-sm"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 72%)",
                }}
              />

              {/* Bottle Images Crossfade Container */}
              <div className="relative h-full w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[420px]">
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
                        <div className="hero-bottle bottle-mask relative h-full w-full">
                          <Image
                            src={imgUrl}
                            alt={p.title}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 420px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-56 w-40 items-center justify-center rounded-2xl border border-white/10 bg-ink-2/60 text-center text-xs text-mute backdrop-blur-sm">
                          {p.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scroll Story Notes: Top, Heart, Base groups reading --p via CSS clamp */}
              {current && (
                <>
                  {/* Top Notes (Left / Top-Left) */}
                  {current.notes_top?.length > 0 && (
                    <div
                      style={{
                        willChange: "opacity",
                        opacity: "clamp(0, calc((var(--p) - 0.15) / 0.2), 1)",
                      }}
                      className="pointer-events-none absolute left-0 top-[18%] max-w-[110px] sm:max-w-[145px] text-left sm:left-2"
                    >
                      <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                        Top Notes
                      </span>
                      <p className="mt-0.5 text-[11px] sm:text-xs leading-tight text-bone/85">
                        {current.notes_top.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Heart Notes (Right / Middle-Right) */}
                  {current.notes_heart?.length > 0 && (
                    <div
                      style={{
                        willChange: "opacity",
                        opacity: "clamp(0, calc((var(--p) - 0.40) / 0.2), 1)",
                      }}
                      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 max-w-[110px] sm:max-w-[145px] text-right sm:right-2"
                    >
                      <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                        Heart Notes
                      </span>
                      <p className="mt-0.5 text-[11px] sm:text-xs leading-tight text-bone/85">
                        {current.notes_heart.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Base Notes (Left / Bottom-Left) */}
                  {current.notes_base?.length > 0 && (
                    <div
                      style={{
                        willChange: "opacity",
                        opacity: "clamp(0, calc((var(--p) - 0.65) / 0.2), 1)",
                      }}
                      className="pointer-events-none absolute bottom-[18%] left-0 max-w-[110px] sm:max-w-[145px] text-left sm:left-2"
                    >
                      <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
                        Base Notes
                      </span>
                      <p className="mt-0.5 text-[11px] sm:text-xs leading-tight text-bone/85">
                        {current.notes_base.join(", ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile-only CTA and tagline placed below the bottle */}
            <div className="flex flex-col items-start gap-2 pt-1 lg:hidden">
              <Button href="/shop">Explore collection</Button>
              <p className="font-script text-lg text-gold/90">
                More than just a fragrance. It&apos;s a vibe.
              </p>
            </div>
          </div>

          {/* Bottom Bar: Active Product Caption + Controls */}
          <div className="flex items-end justify-between gap-4 border-t border-white/5 pt-2">
            {/* Active fragrance caption */}
            <div className="min-w-0 max-w-[65%]">
              {current ? (
                <div>
                  <Link
                    href={`/shop/${current.slug}`}
                    className="group inline-flex items-baseline gap-2 truncate"
                  >
                    <h2 className="truncate font-serif text-base sm:text-xl text-bone transition-colors group-hover:text-gold">
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
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <span aria-hidden="true" className="text-sm">←</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next fragrance"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
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

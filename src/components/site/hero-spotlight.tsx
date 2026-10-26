"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroProductData } from "@/lib/site/public-data";
import type { HeroScene } from "@/lib/site/hero-scenes";
import { Button } from "@/components/site/ui/button";
import { Price } from "@/components/site/ui/price";
import { whatsappLink, productWhatsAppMessage } from "@/lib/site/whatsapp";
import { cartStore } from "@/lib/site/cart-store";

const HeroMist = dynamic(() => import("./hero-mist"), { ssr: false });

interface HeroSpotlightProps {
  scenes: HeroScene[];
  products: HeroProductData[];
  whatsappNumber: string | null;
}

const FALLBACK_SCENES: HeroScene[] = [
  {
    src: "",
    alt: "Jun.fragrance perfume scene",
    accent: "#C9A66B",
    objectPosition: "center center",
  },
];

function HeroStripAddToCartButton({ productId, title }: { productId: string; title: string }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cartStore.addItem(productId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      aria-label={added ? "Added to cart" : `Add ${title} to cart`}
      className={`inline-flex min-h-11 min-w-11 h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all ${
        added
          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
          : "border-gold/40 bg-gold/15 text-gold hover:bg-gold/25"
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold`}
    >
      {added ? (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <span aria-hidden="true" className="text-xl leading-none font-light">
          +
        </span>
      )}
    </button>
  );
}

export function HeroSpotlight({ scenes, products, whatsappNumber }: HeroSpotlightProps) {
  const effectiveScenes = scenes.length > 0 ? scenes : FALLBACK_SCENES;
  const [sceneIndex, setSceneIndex] = useState(0);
  const [canLoadMist, setCanLoadMist] = useState(false);
  const [hasDrawnMist, setHasDrawnMist] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Autoplay pause condition flags stored in refs for zero-overhead loop checks
  const isTabHiddenRef = useRef(false);
  const isHeroOffScreenRef = useRef(false);
  const isInteractingRef = useRef(false);
  const isPointerOverControlsRef = useRef(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sceneCount = effectiveScenes.length;
  const activeScene = effectiveScenes[sceneIndex] ?? effectiveScenes[0];
  const accentColor = activeScene.accent || "#C9A66B";

  const nextScene = useCallback(() => {
    if (sceneCount <= 1) return;
    setSceneIndex((prev) => (prev + 1) % sceneCount);
  }, [sceneCount]);

  const prevScene = useCallback(() => {
    if (sceneCount <= 1) return;
    setSceneIndex((prev) => (prev - 1 + sceneCount) % sceneCount);
  }, [sceneCount]);

  const handleFirstFrame = useCallback(() => {
    setHasDrawnMist(true);
  }, []);

  const handleContextLost = useCallback(() => {
    setHasDrawnMist(false);
  }, []);

  // Update paused state for CSS progress line animation
  const syncAutoplayState = useCallback(() => {
    const shouldPause =
      isTabHiddenRef.current ||
      isHeroOffScreenRef.current ||
      isInteractingRef.current ||
      isPointerOverControlsRef.current;
    setIsAutoplayPaused(shouldPause);
  }, []);

  // 6-second Autoplay timer with pause handling & manual restart
  useEffect(() => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion || sceneCount <= 1) return;

    const clearTimer = () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const isPaused =
        isTabHiddenRef.current ||
        isHeroOffScreenRef.current ||
        isInteractingRef.current ||
        isPointerOverControlsRef.current;

      if (!isPaused) {
        autoplayTimerRef.current = setTimeout(() => {
          nextScene();
        }, 6000);
      }
    };

    scheduleNext();

    return () => clearTimer();
  }, [sceneIndex, sceneCount, nextScene, isAutoplayPaused]);

  // Keyboard navigation (restarts 6s timer via sceneIndex change)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextScene();
      if (e.key === "ArrowLeft") prevScene();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextScene, prevScene]);

  // Load WebGL mist chunk after first paint
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

  // Spotlight animation loop & pause listeners
  useEffect(() => {
    const stage = stageRef.current;
    const spotlight = spotlightRef.current;
    const container = containerRef.current;
    if (!stage || !spotlight || !container) return;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReducedMotion) {
      spotlight.style.transform = "translate3d(0, 0, 0) scale(2)";
      return;
    }

    let isVisible = true;
    let isIntersecting = true;
    let animId: number;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastInputTime = performance.now();
    let scrollProgress = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetX = e.clientX - (rect.left + rect.width / 2);
        targetY = e.clientY - (rect.top + rect.height / 2);
        lastInputTime = performance.now();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = stage.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          targetX = touch.clientX - (rect.left + rect.width / 2);
          targetY = touch.clientY - (rect.top + rect.height / 2);
          lastInputTime = performance.now();
        }
      }
    };

    const targetEl = container;
    targetEl.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
    targetEl.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      isTabHiddenRef.current = document.hidden;
      syncAutoplayState();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      isHeroOffScreenRef.current = !entry.isIntersecting;
      syncAutoplayState();
    });
    observer.observe(container);

    let rafScrollId: number;
    const updateScrollProgress = () => {
      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) {
        scrollProgress = 0;
        container.style.setProperty("--p", "0");
        return;
      }
      const scrolled = -rect.top;
      scrollProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      container.style.setProperty("--p", scrollProgress.toFixed(4));
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafScrollId);
      rafScrollId = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      if (!isVisible || !isIntersecting) return;

      const timeSinceInput = currentTime - lastInputTime;

      if (timeSinceInput > 1500) {
        const t = (currentTime - 1500) * 0.0008;
        const widthHalf = stage.clientWidth * 0.35;
        const heightHalf = stage.clientHeight * 0.35;
        targetX = Math.sin(t * 1.5) * widthHalf;
        targetY = Math.cos(t * 2.2) * heightHalf;
      }

      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      const currentScale = 1.0 + scrollProgress * 3.2;

      spotlight.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`;
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(rafScrollId);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      targetEl.removeEventListener("pointermove", onPointerMove as EventListener);
      targetEl.removeEventListener("touchmove", onTouchMove as EventListener);
    };
  }, [syncAutoplayState]);

  // Touch tracking for swipe & interaction pause
  const handleTouchStart = (e: React.TouchEvent) => {
    isInteractingRef.current = true;
    syncAutoplayState();

    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-no-swipe]")) {
      touchStartX.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    isInteractingRef.current = false;
    syncAutoplayState();

    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextScene();
      } else {
        prevScene();
      }
    }
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    isInteractingRef.current = false;
    touchStartX.current = null;
    syncAutoplayState();
  };

  const onControlsPointerEnter = () => {
    isPointerOverControlsRef.current = true;
    syncAutoplayState();
  };

  const onControlsPointerLeave = () => {
    isPointerOverControlsRef.current = false;
    syncAutoplayState();
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  return (
    <div
      ref={containerRef}
      data-hero-container
      data-mist="css"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={
        {
          "--mist-accent": accentColor,
          "--p": "0",
        } as React.CSSProperties
      }
      className="relative h-[160svh] w-full"
    >
      {/* Sticky Stage (height: 100svh) */}
      <div
        ref={stageRef}
        style={{ contain: "layout paint" }}
        className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-ink"
      >
        {/* Layer 1: Scene Background Photos (crossfading) or gradient fallback */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {effectiveScenes.map((scene, idx) => {
            const isActive = idx === sceneIndex;
            return (
              <div
                key={scene.src || idx}
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 800ms ease-out",
                }}
                className="absolute inset-0 h-full w-full"
              >
                {scene.src ? (
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    fill
                    priority={idx === 0}
                    loading={idx === 0 ? "eager" : "lazy"}
                    sizes="100vw"
                    style={{ objectPosition: scene.objectPosition }}
                    className="object-cover scale-100 transition-transform duration-1000 ease-out"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `radial-gradient(ellipse at 60% 40%, color-mix(in srgb, ${scene.accent} 35%, transparent), #0A0908 75%)`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Layer 2: Dark Room Overlay with Spotlight Torch Hole
            Positioned centered, 300vmax wide, moved ONLY via GPU translate3d and scale */}
        <div
          ref={spotlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 will-change-transform"
          style={{
            width: "300vmax",
            height: "300vmax",
            background:
              "radial-gradient(circle at center, transparent 0, transparent 14vmax, rgba(10,9,8,.55) 24vmax, rgba(10,9,8,.94) 42vmax)",
          }}
        />

        {/* Layer 3: Mist (WebGL or CSS fallback) */}
        <div
          style={{
            willChange: "opacity",
            opacity: hasDrawnMist ? 0 : "calc(0.5 + (1 - var(--p)) * 0.5)",
            transition: "opacity 900ms ease-out",
          }}
          className="mist-fallback pointer-events-none absolute inset-0 z-20"
        />

        {canLoadMist ? (
          <HeroMist
            accentColor={accentColor}
            onFirstFrame={handleFirstFrame}
            onContextLost={handleContextLost}
          />
        ) : null}

        {/* Layer 4: Stage Film Grain Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-25 opacity-20 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]"
        />

        {/* Layer 5: UI Content (CSS Grid fit for 100svh across mobile & desktop) */}
        <div className="container-site relative z-30 grid h-full w-full grid-rows-[auto_1fr_auto] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))]">
          {/* Top: Eyebrow */}
          <div className="pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-[.32em] text-gold md:text-xs">
              JUN.FRAGRANCE
            </p>
          </div>

          {/* Middle: Huge Serif Headline + Subline + Tagline */}
          <div className="my-auto flex flex-col items-start justify-center text-left py-2 max-w-4xl">
            <h1 className="font-serif text-[clamp(2.6rem,11.5vw,7.5rem)] font-normal leading-[0.95] tracking-tight text-bone drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
              <span className="block overflow-hidden">
                <span className="block hero-line-1">Scents that</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block italic hero-line-2">tell your</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block italic hero-line-3">story</span>
              </span>
            </h1>

            <p className="mt-3.5 hidden max-w-xl text-xs leading-relaxed text-mute drop-shadow md:block md:text-sm lg:text-base">
              Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.
            </p>

            <p className="mt-3 font-script text-xl text-gold/95 drop-shadow sm:text-2xl md:text-3xl">
              More than just a fragrance. It&apos;s a vibe.
            </p>
          </div>

          {/* Bottom Area: Explore CTA + Slide Controls + Mini Product Order Strip */}
          <div className="flex flex-col gap-3 pb-1 pr-[72px] sm:pr-0">
            {/* Action Row: CTA & Slide Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button href="/shop">Explore collection</Button>

              {sceneCount > 1 ? (
                <div
                  data-no-swipe
                  onPointerEnter={onControlsPointerEnter}
                  onPointerLeave={onControlsPointerLeave}
                  className="flex items-center gap-3"
                >
                  <span className="font-sans text-[11px] tracking-widest text-gold tabular-nums">
                    {String(sceneIndex + 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}
                  </span>

                  {/* Thin Progress line restarted on key={sceneIndex} */}
                  <div className="hidden h-0.5 w-12 rounded-full bg-white/10 sm:block overflow-hidden">
                    <div
                      key={sceneIndex}
                      className={`h-full w-full bg-gold hero-progress-active ${
                        isAutoplayPaused ? "hero-progress-paused" : ""
                      }`}
                    />
                  </div>

                  {/* 44px Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevScene}
                      aria-label="Previous scene"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <span aria-hidden="true" className="text-sm">←</span>
                    </button>

                    <button
                      type="button"
                      onClick={nextScene}
                      aria-label="Next scene"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <span aria-hidden="true" className="text-sm">→</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Mini Product Order Strip (up to 4 products) */}
            {products && products.length > 0 ? (
              <div
                data-no-swipe
                onPointerEnter={onControlsPointerEnter}
                onPointerLeave={onControlsPointerLeave}
                className="mt-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {products.slice(0, 4).map((p) => {
                  const thumb = p.images?.[0];
                  const orderUrl = whatsappNumber
                    ? whatsappLink(
                        whatsappNumber,
                        productWhatsAppMessage(p.title, p.size_ml, siteUrl, p.slug)
                      )
                    : null;

                  return (
                    <div
                      key={p.slug || p.id}
                      className="flex w-[265px] shrink-0 snap-start items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-ink-2/80 p-2 backdrop-blur-sm transition-colors hover:border-gold/40"
                    >
                      <Link
                        href={`/shop/${p.slug}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5 group"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/40">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={p.title}
                              fill
                              sizes="56px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] text-mute">
                              JUN
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-sm font-medium text-bone group-hover:text-gold transition-colors">
                            {p.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gold">
                            <Price value={p.price} />
                          </p>
                        </div>
                      </Link>

                      {orderUrl ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <HeroStripAddToCartButton productId={p.id} title={p.title} />
                          <a
                            href={orderUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Order ${p.title} on WhatsApp`}
                            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#155D3A] text-white transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                          >
                            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
                            </svg>
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  title: string;
  accentColor: string;
}

export function ProductGallery({
  images,
  title,
  accentColor,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayImages = images.length > 0 ? images : ["/hero/scene-1.jpg"];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== activeIndex && idx >= 0 && idx < displayImages.length) {
        setActiveIndex(idx);
      }
    }
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Frame (4:5 aspect, rounded, soft accent glow behind, no cutout) */}
      <div className="relative aspect-[4/5] w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-2">
        {/* Soft accent glow behind image */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-50"
          style={{
            background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${accentColor} 20%, transparent) 0%, transparent 75%)`,
          }}
        />

        {/* Mobile: horizontal scroll-snap swipe container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full min-w-0 max-w-full snap-x snap-mandatory overflow-x-auto pb-0 overscroll-x-contain [touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch] scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
        >
          {displayImages.map((src, i) => (
            <div
              key={src + i}
              className="relative h-full w-full flex-none snap-center"
            >
              <Image
                src={src}
                alt={`${title} - view ${i + 1}`}
                fill
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 46vw, 37rem"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop: single active image */}
        <div className="hidden h-full w-full md:block">
          <Image
            src={displayImages[activeIndex] || displayImages[0]}
            alt={`${title} - view ${activeIndex + 1}`}
            fill
            loading={activeIndex === 0 ? "eager" : "lazy"}
            fetchPriority={activeIndex === 0 ? "high" : undefined}
            sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 46vw, 37rem"
            className="object-cover transition-opacity duration-300"
          />
        </div>

        {/* Mobile swipe dots indicator */}
        {displayImages.length > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {displayImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-5 bg-gold"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop thumbnails row */}
      {displayImages.length > 1 ? (
        <div className="hidden gap-3 md:flex">
          {displayImages.map((src, i) => {
            const isCurrent = i === activeIndex;
            return (
              <button
                key={src + i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-[4/5] w-20 overflow-hidden rounded-xl border transition-all ${
                  isCurrent
                    ? "border-gold ring-1 ring-gold"
                    : "border-white/10 opacity-70 hover:opacity-100"
                }`}
                aria-label={`Select view ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`${title} thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

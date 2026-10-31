"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BundleProduct } from "@/lib/site/public-data";
import { bundleWhatsAppMessage, whatsappLink } from "@/lib/site/whatsapp";
import { Price } from "./ui/price";
import { useIntlStore } from "./intl-provider";

interface BundlePickerProps {
  products: BundleProduct[];
  bundlePrice: number;
  whatsappNumber: string | null;
  siteUrl: string;
}

const STORAGE_KEY = "jf_bundle_v1";

type GenderFilter = "all" | "men" | "women" | "unisex";

export function BundlePicker({
  products,
  bundlePrice,
  whatsappNumber,
  siteUrl,
}: BundlePickerProps) {
  const { enabled: intlEnabled, country } = useIntlStore();
  const international = intlEnabled && country.code !== "PK";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);

  const desktopSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileSlotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const productsById = useMemo(() => {
    const map = new Map<string, BundleProduct>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  // Hydrate selection from localStorage after mount
  useEffect(() => {
    let valid: string[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          valid = parsed
            .filter((id): id is string => typeof id === "string" && productsById.has(id))
            .slice(0, 3);
        }
      }
    } catch {
      // LocalStorage access might fail or be disabled
    }

    const timer = setTimeout(() => {
      if (valid.length > 0) {
        setSelectedIds(valid);
      }
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [productsById]);

  // Persist selection after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // Ignore
    }
  }, [selectedIds, isHydrated]);

  const removeProduct = (id: string) => {
    setJustCompleted(false);
    setSelectedIds((prev) => {
      const idx = prev.lastIndexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const removeSlot = (index: number) => {
    setJustCompleted(false);
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
  };

  // Flying clone animation using Web Animations API (transform & opacity only)
  const triggerFlyAnimation = (cardEl: HTMLElement, targetSlotIndex: number) => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const isDesktop = window.innerWidth >= 1024;
    const targetSlotEl = (isDesktop ? desktopSlotRefs : mobileSlotRefs).current[targetSlotIndex];
    if (!targetSlotEl) return;

    const startRect = cardEl.getBoundingClientRect();
    const endRect = targetSlotEl.getBoundingClientRect();
    if (startRect.width === 0 || endRect.width === 0) return;

    const clone = document.createElement("div");
    clone.style.position = "fixed";
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "1rem";
    clone.style.overflow = "hidden";
    clone.style.boxShadow = "0 12px 30px rgba(0,0,0,0.6)";

    const imgEl = cardEl.querySelector("img");
    if (imgEl) {
      const cloneImg = document.createElement("img");
      cloneImg.src = imgEl.src;
      cloneImg.style.width = "100%";
      cloneImg.style.height = "100%";
      cloneImg.style.objectFit = "cover";
      clone.appendChild(cloneImg);
    }

    document.body.appendChild(clone);

    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = endRect.left + endRect.width / 2;
    const endCenterY = endRect.top + endRect.height / 2;

    const deltaX = endCenterX - startCenterX;
    const deltaY = endCenterY - startCenterY;
    const scaleX = endRect.width / startRect.width;
    const scaleY = endRect.height / startRect.height;
    const targetRadius = Math.round(endRect.width * 0.25);

    const anim = clone.animate(
      [
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
          opacity: 0.9,
          borderRadius: `${targetRadius}px`,
        },
      ],
      {
        duration: 450,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      }
    );

    anim.onfinish = () => {
      clone.remove();
    };
  };

  const addProductWithAnimation = (product: BundleProduct, cardEl: HTMLElement | null) => {
    if (selectedIds.length >= 3) return;
    const nextSlotIndex = selectedIds.length;
    if (cardEl) {
      triggerFlyAnimation(cardEl, nextSlotIndex);
    }
    if (nextSlotIndex === 2) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1600);
    }
    setSelectedIds((prev) => [...prev, product.id]);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (genderFilter !== "all") {
        const prodGender = (p.gender ?? "").toLowerCase();
        if (prodGender !== genderFilter) return false;
      }
      if (query) {
        if (!p.title.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [products, genderFilter, searchQuery]);

  // Selected items resolved to products
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => productsById.get(id))
      .filter((p): p is BundleProduct => Boolean(p));
  }, [selectedIds, productsById]);

  const isComplete = selectedIds.length === 3;

  // Trio distinct notes (up to 6)
  const trioNotes = useMemo(() => {
    const noteSet = new Set<string>();
    for (const prod of selectedProducts) {
      const allNotes = [
        ...(prod.notes_top ?? []),
        ...(prod.notes_heart ?? []),
        ...(prod.notes_base ?? []),
      ];
      for (const n of allNotes) {
        const clean = n.trim();
        if (clean) noteSet.add(clean);
      }
    }
    return Array.from(noteSet).slice(0, 6);
  }, [selectedProducts]);

  // Surprise me: fills remaining slots with random perfumes respecting active gender filter
  const handleSurpriseMe = () => {
    const needed = 3 - selectedIds.length;
    if (needed <= 0) return;

    const pool = filteredProducts.length > 0 ? filteredProducts : products;
    if (pool.length === 0) return;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks: string[] = [];
    for (const item of shuffled) {
      if (picks.length >= needed) break;
      picks.push(item.id);
    }
    while (picks.length < needed) {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      picks.push(randomItem.id);
    }

    if (selectedIds.length + picks.length >= 3) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1600);
    }

    setSelectedIds((prev) => [...prev, ...picks]);
  };

  // Savings calculation
  const regularTotal = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [selectedProducts]);

  const showSavings = regularTotal > bundlePrice;
  const savings = showSavings ? regularTotal - bundlePrice : 0;

  // WhatsApp order link
  const orderMessage = useMemo(() => {
    if (selectedProducts.length !== 3) return "";
    return bundleWhatsAppMessage(
      bundlePrice,
      selectedProducts.map((p) => ({
        title: p.title,
        size_ml: p.size_ml,
        slug: p.slug,
      })),
      siteUrl
    );
  }, [selectedProducts, bundlePrice, siteUrl]);

  const waOrderUrl = useMemo(() => {
    if (!whatsappNumber || !orderMessage) return null;
    return whatsappLink(whatsappNumber, orderMessage);
  }, [whatsappNumber, orderMessage]);

  const countsByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of selectedIds) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [selectedIds]);

  // CSS variables for soft ambient mood lighting
  const moodVars = useMemo(() => {
    const a1 = selectedProducts[0]?.accent_color || "rgba(212, 175, 55, 0.15)";
    const a2 = selectedProducts[1]?.accent_color || "rgba(180, 140, 60, 0.10)";
    const a3 = selectedProducts[2]?.accent_color || "rgba(120, 90, 40, 0.08)";
    return {
      "--a1": a1,
      "--a2": a2,
      "--a3": a3,
    } as React.CSSProperties;
  }, [selectedProducts]);

  return (
    <div className="relative pb-48 lg:pb-16" style={moodVars}>
      {/* Soft radial-gradient mood lighting background mixing accent colors of chosen perfumes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -top-20 left-1/4 h-[520px] w-[520px] rounded-full blur-3xl opacity-25 transition-all duration-700"
          style={{ background: "radial-gradient(circle, var(--a1) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-20 h-[460px] w-[460px] rounded-full blur-3xl opacity-20 transition-all duration-700"
          style={{ background: "radial-gradient(circle, var(--a2) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-20 left-1/3 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 transition-all duration-700"
          style={{ background: "radial-gradient(circle, var(--a3) 0%, transparent 70%)" }}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:items-start">
        {/* Main Column: Controls and Product Grid */}
        <div className="min-w-0">
          {/* Controls: Search, Gender filter chips, and Surprise me button */}
          <div className="mb-8 space-y-4">
            {/* Search Input */}
            <div className="relative max-w-md">
              <label htmlFor="bundle-perfume-search" className="sr-only">
                Search perfumes
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-mute">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                id="bundle-perfume-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search perfumes by name..."
                className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-mute outline-none transition focus:border-gold/60 focus:bg-white/10"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-mute hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>

            {/* Filter Chips + Surprise me */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by gender">
              {(
                [
                  { id: "all", label: "All Perfumes" },
                  { id: "men", label: "Men" },
                  { id: "women", label: "Women" },
                  { id: "unisex", label: "Unisex" },
                ] as const
              ).map((chip) => {
                const active = genderFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setGenderFilter(chip.id)}
                    aria-pressed={active}
                    className={`min-h-[40px] rounded-full px-4 text-xs font-semibold tracking-wide transition-all motion-reduce:transition-none ${
                      active
                        ? "bg-gold text-ink shadow-md"
                        : "border border-white/15 bg-white/5 text-mute hover:border-gold/40 hover:text-white"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}

              {/* Surprise me button */}
              <button
                type="button"
                onClick={handleSurpriseMe}
                disabled={isComplete}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                aria-label="Surprise me: fill remaining slots with random perfumes"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 011.342 1.341l-.8 1.6 1.582 3.954H20a1 1 0 110 2h-1.323l-1.582 3.954.8 1.6a1 1 0 01-1.342 1.341l-1.6-.8-3.953 1.582V20a1 1 0 11-2 0v-1.323l-3.954-1.582-1.599.8a1 1 0 01-1.342-1.341l.8-1.6-1.582-3.954H0a1 1 0 110-2h1.323l1.582-3.954-.8-1.6A1 1 0 013.447 3.1l1.6.8L9 2.323V1a1 1 0 011-1z" />
                </svg>
                <span>Surprise me</span>
              </button>

              <span className="ml-auto text-xs text-mute">
                {filteredProducts.length} {filteredProducts.length === 1 ? "perfume" : "perfumes"}
              </span>
            </div>
          </div>

          {/* Product Grid: 2 cols phone, 3 cols md, 3 cols on lg (beside panel) */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-mute">
              <p className="text-base font-serif text-white">No perfumes found</p>
              <p className="mt-1 text-xs">Try adjusting your search terms or gender filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setGenderFilter("all");
                }}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-gold/40 px-4 text-xs font-semibold text-gold hover:bg-gold/10"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:gap-5">
              {filteredProducts.map((product) => {
                const count = countsByProduct.get(product.id) ?? 0;
                const slotIndices = selectedIds
                  .map((id, index) => (id === product.id ? index + 1 : null))
                  .filter((idx): idx is number => idx !== null);

                const isSelected = slotIndices.length > 0;
                const isDimmed = isComplete && !isSelected;
                const accentColor = product.accent_color || "#D4AF37";

                return (
                  <div
                    key={product.id}
                    data-bundle-card
                    className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 sm:p-3 shadow-lg backdrop-blur-sm transition-all duration-300 motion-reduce:transition-none ${
                      isDimmed
                        ? "opacity-60 bg-surface/30 border-white/5"
                        : "bg-surface/60 hover:shadow-gold/5"
                    }`}
                    style={{
                      borderColor: isSelected
                        ? accentColor
                        : undefined,
                      boxShadow: isSelected
                        ? `0 0 15px color-mix(in srgb, ${accentColor} 30%, transparent)`
                        : undefined,
                    }}
                  >
                    <div>
                      {/* Photo 4:5 */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink/60">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-mute">
                            Jun.fragrance
                          </div>
                        )}

                        {/* Slot number badge */}
                        {isSelected ? (
                          <div
                            className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-ink shadow-md"
                            style={{ backgroundColor: accentColor }}
                          >
                            <span>Slot {slotIndices.join(", ")}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Title & Size */}
                      <div className="mt-2.5">
                        <h3 className="line-clamp-1 font-serif text-sm font-medium text-white sm:text-base">
                          {product.title}
                        </h3>
                        <div className="mt-0.5 flex items-center justify-between text-xs text-mute">
                          <span>50 ml</span>
                          <Price value={product.price} className="text-gold/90 font-medium" />
                        </div>
                      </div>
                    </div>

                    {/* 44px Add / Quantity Controls */}
                    <div className="mt-3">
                      {count === 0 ? (
                        <button
                          type="button"
                          onClick={(e) =>
                            addProductWithAnimation(
                              product,
                              e.currentTarget.closest<HTMLElement>("[data-bundle-card]")
                            )
                          }
                          disabled={isComplete}
                          aria-label={`Add ${product.title} to bundle`}
                          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition-all duration-200 hover:bg-gold/20 hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold/10 disabled:hover:border-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add
                        </button>
                      ) : (
                        <div className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-gold/60 bg-gold/15 p-1">
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            aria-label={`Remove one ${product.title} from bundle`}
                            className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gold hover:bg-gold/20 focus-visible:outline focus-visible:outline-gold"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                          </button>
                          <span className="font-mono text-sm font-bold text-white px-1">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={(e) =>
                              addProductWithAnimation(
                                product,
                                e.currentTarget.closest<HTMLElement>("[data-bundle-card]")
                              )
                            }
                            disabled={isComplete}
                            aria-label={`Add another ${product.title} to bundle`}
                            className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gold hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-gold"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Sticky Side Panel (lg and above) */}
        <aside
          aria-label="Trio Box selection panel"
          className="hidden lg:block lg:sticky lg:top-24 rounded-3xl border border-white/15 bg-ink-2/95 p-6 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-semibold tracking-widest text-gold uppercase">
              YOUR TRIO
            </span>
            <span className="font-serif text-sm font-medium text-bone">
              {isComplete ? "Your trio is ready" : `${selectedIds.length} of 3 selected`}
            </span>
          </div>

          {/* Arched Windows with Connecting Gold Line */}
          <div className="relative mt-6 pt-2 pb-4">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-6 right-6 h-6 w-[calc(100%-3rem)] overflow-visible"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M 16 18 Q 33 2 50 18 Q 67 2 84 18"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1.5"
                strokeDasharray="120"
                strokeDashoffset={isComplete ? 0 : 120}
                className="transition-[stroke-dashoffset] duration-[600ms] ease-out motion-reduce:transition-none"
              />
            </svg>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((slotIdx) => {
                const prod = selectedProducts[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    ref={(el) => {
                      desktopSlotRefs.current[slotIdx] = el;
                    }}
                    className={`relative aspect-[140/300] w-full [container-type:inline-size] rounded-[35px] [border-radius:25cqw] transition-transform duration-400 ease-out motion-reduce:transition-none ${
                      isComplete ? "-translate-y-1" : "translate-y-0"
                    }`}
                  >
                    {prod ? (
                      <div
                        className="relative h-full w-full overflow-hidden rounded-[35px] [border-radius:25cqw] border border-[#75552D]"
                        style={{
                          boxShadow: `0 0 16px ${
                            prod.accent_color ? prod.accent_color + "66" : "rgba(201,165,107,0.4)"
                          }`,
                        }}
                      >
                        <Image
                          src={prod.image || "/bundle/bundle-poster-new.webp"}
                          alt={prod.title}
                          fill
                          sizes="110px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => removeSlot(slotIdx)}
                          aria-label={`Remove ${prod.title} from slot ${slotIdx + 1}`}
                          className="absolute -top-1.5 -right-1.5 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center text-white focus-visible:outline focus-visible:outline-gold"
                        >
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-ink/90 border border-white/20 text-xs font-bold leading-none text-white hover:bg-rose-600 transition-colors">
                            ×
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-[35px] [border-radius:25cqw] border-2 border-dashed border-[#C9A56B] bg-[#C9A56B]/[0.04] animate-pulse">
                        <span className="font-serif text-sm font-semibold text-[#C9A56B]">
                          {slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trio Notes (up to 6 chips, only real data, hidden when empty) */}
          {trioNotes.length > 0 ? (
            <div className="mt-2 border-t border-white/10 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold/80">
                Your trio&apos;s notes
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {trioNotes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] text-bone"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Pricing & Savings */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-mute">Trio bundle price</span>
              <Price value={bundlePrice} className="font-serif text-xl font-semibold text-gold" />
            </div>
            {showSavings && !international ? (
              <p className="mt-1 text-right text-xs font-medium text-emerald-400">
                Regular Rs. {regularTotal.toLocaleString()}, you save Rs. {savings.toLocaleString()}
              </p>
            ) : null}
          </div>

          {/* Order Action Button */}
          <div className="mt-6">
            {isComplete && waOrderUrl ? (
              <a
                href={waOrderUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500 hover:shadow-emerald-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 motion-reduce:transition-none ${
                  justCompleted ? "animate-pulse ring-2 ring-emerald-300" : ""
                }`}
              >
                <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
                </svg>
                Order trio on WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-mute opacity-60"
              >
                Pick {3 - selectedIds.length} more to complete
              </button>
            )}
            <p className="mt-3 text-center text-[10px] text-mute">
              One bundle per order. Need more? Tell us on WhatsApp.
            </p>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Tray on Phones & Tablets (< lg) */}
      <aside
        aria-label="Bundle selection tray"
        className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/15 bg-ink/95 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl backdrop-blur-md"
      >
        <div className="mx-auto max-w-lg">
          {/* Header line + Arched Slots */}
          <div className="flex items-center justify-between gap-3">
            {/* Arches row */}
            <div className="relative flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -top-1.5 left-2 right-2 h-4 w-[calc(100%-1rem)] overflow-visible"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M 16 18 Q 33 2 50 18 Q 67 2 84 18"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeDasharray="120"
                  strokeDashoffset={isComplete ? 0 : 120}
                  className="transition-[stroke-dashoffset] duration-[600ms] ease-out motion-reduce:transition-none"
                />
              </svg>

              {[0, 1, 2].map((slotIdx) => {
                const prod = selectedProducts[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    ref={(el) => {
                      mobileSlotRefs.current[slotIdx] = el;
                    }}
                    className={`relative aspect-[140/200] w-14 sm:w-16 max-w-[84px] shrink-0 [container-type:inline-size] rounded-[21px] [border-radius:25cqw] transition-transform duration-400 ease-out motion-reduce:transition-none ${
                      isComplete ? "-translate-y-1" : "translate-y-0"
                    }`}
                  >
                    {prod ? (
                      <div
                        className="relative h-full w-full overflow-hidden rounded-[21px] [border-radius:25cqw] border border-[#75552D]"
                        style={{
                          boxShadow: `0 0 12px ${
                            prod.accent_color ? prod.accent_color + "66" : "rgba(201,165,107,0.4)"
                          }`,
                        }}
                      >
                        <Image
                          src={prod.image || "/bundle/bundle-poster-new.webp"}
                          alt={prod.title}
                          fill
                          sizes="84px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeSlot(slotIdx)}
                          aria-label={`Remove ${prod.title} from slot ${slotIdx + 1}`}
                          className="absolute -top-1.5 -right-1.5 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center text-white focus-visible:outline focus-visible:outline-gold"
                        >
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-ink/90 border border-white/20 text-[10px] font-bold leading-none text-white hover:bg-rose-600">
                            ×
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-[21px] [border-radius:25cqw] border-2 border-dashed border-[#C9A56B] bg-[#C9A56B]/[0.04] animate-pulse">
                        <span className="font-serif text-xs font-semibold text-[#C9A56B]">
                          {slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status & Savings */}
            <div className="flex flex-col min-w-0 flex-1">
              <span
                aria-live="polite"
                className="font-serif text-xs sm:text-sm font-semibold tracking-tight text-white line-clamp-1"
              >
                {isComplete ? "Your trio is ready" : `${selectedIds.length} of 3 selected`}
              </span>
              {showSavings ? (
                <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 line-clamp-1">
                  Save Rs. {savings.toLocaleString()} (Rs. {bundlePrice.toLocaleString()})
                </span>
              ) : (
                <span className="text-[10px] text-mute line-clamp-1">
                  Rs. {bundlePrice.toLocaleString()} for 3
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp Order Action Button on mobile */}
          <div className="mt-2.5">
            {isComplete && waOrderUrl ? (
              <a
                href={waOrderUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 motion-reduce:transition-none ${
                  justCompleted ? "animate-pulse ring-2 ring-emerald-300" : ""
                }`}
              >
                <svg aria-hidden="true" className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
                </svg>
                <span>Order trio on WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-mute opacity-60"
              >
                Pick {3 - selectedIds.length} more to order
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { BundleProduct } from "@/lib/site/public-data";
import { bundleWhatsAppMessage, whatsappLink } from "@/lib/site/whatsapp";
import { Price } from "./ui/price";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const addProduct = (id: string) => {
    if (selectedIds.length >= 3) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeProduct = (id: string) => {
    setSelectedIds((prev) => {
      const idx = prev.lastIndexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const removeSlot = (index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
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

  return (
    <div className="relative pb-40">
      {/* Client Controls: Filter chips & Search */}
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

        {/* Filter Chips */}
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
          <span className="ml-auto text-xs text-mute">
            {filteredProducts.length} {filteredProducts.length === 1 ? "perfume" : "perfumes"}
          </span>
        </div>
      </div>

      {/* Product Grid: 2 cols phone, 3 cols md, 4 cols xl */}
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 lg:gap-6">
          {filteredProducts.map((product) => {
            const count = countsByProduct.get(product.id) ?? 0;
            const isFull = selectedIds.length >= 3;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-surface/60 p-2.5 sm:p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-gold/30 hover:shadow-gold/5 motion-reduce:transition-none"
              >
                <div>
                  {/* Photo 4:5 */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink/60">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-mute">
                        Jun.fragrance
                      </div>
                    )}

                    {count > 0 ? (
                      <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-ink shadow-md">
                        {count}
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
                      onClick={() => addProduct(product.id)}
                      disabled={isFull}
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
                        onClick={() => addProduct(product.id)}
                        disabled={isFull}
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

      {/* STICKY bottom tray (safe-area aware) */}
      {/* Only rendered if whatsappNumber exists */}
      {whatsappNumber ? (
        <aside
          aria-label="Bundle selection and checkout tray"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/15 bg-ink/95 px-3 py-3 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl transition-transform"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: 3 slots + selection status */}
            <div className="flex items-center gap-3">
              {/* 3 thumbnail slots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((slotIndex) => {
                  const prod = selectedProducts[slotIndex];
                  return (
                    <div
                      key={slotIndex}
                      className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/20 bg-white/5 sm:h-14 sm:w-14"
                    >
                      {prod ? (
                        <>
                          {prod.image ? (
                            <Image
                              src={prod.image}
                              alt={prod.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="font-serif text-[10px] text-mute">Jun.</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSlot(slotIndex)}
                            aria-label={`Remove ${prod.title} from slot ${slotIndex + 1}`}
                            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/90 text-[11px] font-bold text-white hover:bg-red-600 focus-visible:outline focus-visible:outline-gold"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span aria-hidden="true" className="font-mono text-base font-medium text-mute/60">
                          +
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status text & savings */}
              <div className="flex flex-col min-w-0">
                <span
                  aria-live="polite"
                  className="font-serif text-sm font-semibold tracking-tight text-white sm:text-base"
                >
                  {selectedIds.length} of 3 selected
                </span>
                {showSavings ? (
                  <span className="text-[11px] font-medium text-emerald-400 sm:text-xs">
                    Regular price Rs. {regularTotal.toLocaleString()}, you save Rs. {savings.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[11px] text-mute">
                    Pick 3 perfumes for <Price value={bundlePrice} className="text-gold" />
                  </span>
                )}
              </div>
            </div>

            {/* Right side: WhatsApp Order button + single bundle note */}
            <div className="flex flex-col items-stretch sm:items-end gap-1">
              {selectedIds.length === 3 && waOrderUrl ? (
                <a
                  href={waOrderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500 hover:shadow-emerald-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 motion-reduce:transition-none"
                >
                  <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
                  </svg>
                  Order bundle on WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-mute opacity-60"
                >
                  Pick {3 - selectedIds.length} more
                </button>
              )}
              <p className="text-center sm:text-right text-[10px] text-mute">
                One bundle per order. Want more than one bundle? Tell us on WhatsApp.
              </p>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

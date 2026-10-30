"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ui/product-card";
import type { ShopProduct } from "@/lib/site/public-data";

interface ShopCatalogProps {
  products: ShopProduct[];
  whatsappNumber: string | null;
  siteUrl: string;
}

export function ShopCatalog({
  products,
  whatsappNumber,
  siteUrl,
}: ShopCatalogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchInspired = p.inspired_by?.toLowerCase().includes(q);
      return matchTitle || matchInspired;
    });
  }, [products, query]);

  return (
    <div className="space-y-8">
      {/* Search Bar - Client-side only, no page reload or URL mutation */}
      <div className="relative max-w-md">
        <label htmlFor="shop-search" className="sr-only">
          Search perfumes
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-mute">
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          id="shop-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by perfume name or inspiration..."
          className="w-full rounded-xl border border-white/10 bg-ink-2 py-2.5 pl-10 pr-4 text-sm text-bone placeholder-mute/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-mute hover:text-bone"
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Grid: 2 columns phone, 3 md, 4 xl */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {filtered.map((product, idx) => (
            <div key={product.slug || product.id} className="flex">
              <ProductCard
                product={product}
                whatsappNumber={whatsappNumber}
                siteUrl={siteUrl}
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-ink-2/60 p-12 text-center">
          <p className="font-serif text-xl text-bone">No perfumes found</p>
          <p className="mt-2 text-sm text-mute">
            {query
              ? `No fragrances match "${query}". Try searching with a different term.`
              : "No perfumes are currently active in this collection."}
          </p>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex items-center rounded-lg border border-gold/40 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
            >
              Reset search
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { whatsappLink, productWhatsAppMessage } from "@/lib/site/whatsapp";
import { cartStore } from "@/lib/site/cart-store";

interface ProductOrderControlsProps {
  productId: string;
  title: string;
  sizeMl: number;
  slug: string;
  price: number;
  whatsappNumber: string | null;
  siteUrl: string;
}

export function ProductOrderControls({
  productId,
  title,
  sizeMl,
  slug,
  whatsappNumber,
  siteUrl,
}: ProductOrderControlsProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!whatsappNumber) return null;

  const orderUrl = whatsappLink(
    whatsappNumber,
    productWhatsAppMessage(title, sizeMl, siteUrl, slug, qty)
  );

  const handleAddToCart = () => {
    cartStore.addItem(productId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Quantity Stepper (1 to 10) above buttons */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-mute">Quantity:</span>
        <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/5">
          <button
            type="button"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-bone hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-gold"
          >
            &minus;
          </button>
          <span className="min-w-8 text-center font-mono text-sm font-semibold text-bone">
            {qty}
          </span>
          <button
            type="button"
            disabled={qty >= 10}
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            aria-label="Increase quantity"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-bone hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-gold"
          >
            +
          </button>
        </div>
      </div>

      {/* Buttons (Desktop inline under price, mobile inline) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Order now (Green, Primary) */}
        {orderUrl ? (
          <a
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Order ${title} on WhatsApp`}
            className="inline-flex min-h-12 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-[#155D3A]/50 bg-[#155D3A] px-6 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
            </svg>
            <span>Order now</span>
          </a>
        ) : null}

        {/* Add to cart (Outlined) */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`inline-flex min-h-12 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold transition-all ${
            added
              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
              : "border-gold/40 text-gold hover:bg-gold/15"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold`}
        >
          {added ? (
            <>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Added</span>
            </>
          ) : (
            <>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM12 12v6m-3-3h6" />
              </svg>
              <span>Add to cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

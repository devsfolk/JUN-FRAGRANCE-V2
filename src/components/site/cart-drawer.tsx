"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Price } from "./ui/price";
import {
  useCart,
  useCartDrawer,
  cartStore,
  buildCartWhatsAppMessage,
  type CartProductDetail,
} from "@/lib/site/cart-store";
import { whatsappLink } from "@/lib/site/whatsapp";
import { useIntlStore } from "./intl-provider";
import { createInternationalOrderMessage } from "@/lib/site/intl-order-message";

interface CartDrawerProps {
  whatsappNumber: string | null;
  siteUrl: string;
  bundleEnabled?: boolean;
  bundlePrice?: number;
}

export function CartDrawer({
  whatsappNumber,
  siteUrl,
  bundleEnabled = true,
  bundlePrice = 4500,
}: CartDrawerProps) {
  const { isOpen, close } = useCartDrawer();
  const cart = useCart();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const [products, setProducts] = useState<Record<string, CartProductDetail>>({});
  const [removedNote, setRemovedNote] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [fetchTick, setFetchTick] = useState(0);
  const { enabled: intlEnabled, country, quoteMany } = useIntlStore();
  const [intlResult, setIntlResult] = useState<{ key: string; message: string | null } | null>(null);
  const intlOrderKey = `${country.code}:${cart.map((item) => `${item.id}-${item.qty}-${products[item.id]?.price ?? 0}`).join(",")}`;

  // Fetch fresh product details when drawer opens with items
  useEffect(() => {
    if (!isOpen || cart.length === 0) return;

    let ignore = false;
    const ids = cart.map((i) => i.id).join(",");

    fetch(`/api/cart-products?ids=${encodeURIComponent(ids)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        const list: CartProductDetail[] = data.products || [];
        const map: Record<string, CartProductDetail> = {};
        const activeIds = new Set<string>();

        for (const p of list) {
          map[p.id] = p;
          activeIds.add(p.id);
        }

        setProducts(map);
        setFetchError(false);

        const wasPruned = cartStore.removeInactiveIds(activeIds);
        if (wasPruned) {
          setRemovedNote(true);
        }
      })
      .catch(() => {
        if (ignore) return;
        setFetchError(true);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, cart, fetchTick]);

  useEffect(() => {
    let active = true;
    if (!intlEnabled || country.code === "PK" || cart.length === 0 || !country.shipping_pkr) return;
    const items = cart.flatMap((item) => {
      const product = products[item.id];
      return product ? [{ title: product.title, quantity: item.qty, pkrAmount: product.price * item.qty, url: `${siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl}/shop/${product.slug}` }] : [];
    });
    if (items.length !== cart.length) return;
    createInternationalOrderMessage({ country: country.name, currency: country.currency, items, shippingPkr: country.shipping_pkr, quoteMany })
      .then((message) => { if (active) setIntlResult({ key: intlOrderKey, message }); });
    return () => { active = false; };
  }, [intlEnabled, country.code, country.name, country.currency, country.shipping_pkr, cart, products, siteUrl, quoteMany, intlOrderKey]);

  // Focus trap, ESC key, body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the dialog or first focusable element
    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Compute estimated total from fresh data
  let estimatedTotal = 0;
  for (const item of cart) {
    const p = products[item.id];
    if (p) {
      estimatedTotal += p.price * item.qty;
    }
  }

  const whatsappMessage = buildCartWhatsAppMessage({
    items: cart,
    products,
    siteUrl,
  });

  const orderHref = whatsappNumber
    ? intlEnabled && country.code !== "PK"
      ? intlResult?.key === intlOrderKey && intlResult.message ? whatsappLink(whatsappNumber, intlResult.message) : null
      : whatsappLink(whatsappNumber, whatsappMessage)
    : null;

  const plainChatHref = whatsappLink(
    whatsappNumber,
    "Assalam o Alaikum! I would like to know more about Jun.fragrance."
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity motion-reduce:transition-none"
      />

      {/* Drawer Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your Fragrance Cart"
        tabIndex={-1}
        className="relative z-10 flex h-full w-full flex-col border-white/10 bg-ink-2 shadow-2xl transition-transform duration-300 ease-out outline-none motion-reduce:transition-none max-md:max-h-[85svh] max-md:mt-auto max-md:rounded-t-3xl max-md:border-t md:w-[420px] md:border-l"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl font-medium text-bone">Your Cart</h2>
            {cart.length > 0 ? (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-gold">
                {cart.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close cart drawer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-bone/70 hover:bg-white/10 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              &times;
            </span>
          </button>
        </div>

        {/* Removed note banner if discontinued product was auto-pruned */}
        {removedNote ? (
          <div className="bg-gold/15 px-5 py-2.5 text-xs text-gold border-b border-gold/20 flex items-center justify-between">
            <span>Some items are no longer available and were removed.</span>
            <button
              type="button"
              onClick={() => setRemovedNote(false)}
              className="text-gold underline ml-2 text-[11px]"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* Fetch error note */}
        {fetchError ? (
          <div className="bg-red-950/40 px-5 py-2 text-xs text-red-300 border-b border-red-900/30 flex items-center justify-between">
            <span>Could not update prices. Check your connection.</span>
            <button
              type="button"
              onClick={() => setFetchTick((t) => t + 1)}
              className="text-gold underline ml-2 text-[11px]"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 text-gold">
                <svg
                  aria-hidden="true"
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 font-serif text-lg font-medium text-bone">Your cart is empty</h3>
              <p className="mt-1 max-w-xs text-xs text-mute">
                Explore our signature collection of handcrafted, long-lasting fragrances.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/40 bg-gold/15 px-6 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
              >
                Explore perfumes
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {cart.map((item) => {
                const p = products[item.id];
                const unitPrice = p ? p.price : 0;
                const lineTotal = unitPrice * item.qty;

                return (
                  <li key={item.id} className="flex gap-3.5 py-4">
                    {/* Thumbnail */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {p?.image ? (
                        <Image
                          src={p.image}
                          alt={p.title || "Fragrance"}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[10px] text-mute">
                          JUN
                        </div>
                      )}
                    </div>

                    {/* Details & Controls */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate font-serif text-base font-medium text-bone">
                            {p?.title || "Perfume"}
                          </h4>
                          <button
                            type="button"
                            onClick={() => cartStore.removeItem(item.id)}
                            aria-label={`Remove ${p?.title || "item"} from cart`}
                            className="inline-flex min-h-8 min-w-8 items-center justify-center text-xs text-mute hover:text-red-400 focus-visible:outline focus-visible:outline-gold"
                          >
                            &times;
                          </button>
                        </div>

                        <p className="text-xs text-mute mt-0.5">
                          {p?.size_ml ? `${p.size_ml} ml` : "50 ml"} &bull;{" "}
                          <span className="text-gold/90">
                            <Price value={unitPrice} />
                          </span>
                        </p>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="mt-2 flex items-center justify-between">
                        {/* Quantity Stepper (min 44px targets) */}
                        <div className="flex items-center rounded-lg border border-white/15 bg-white/5">
                          <button
                            type="button"
                            disabled={item.qty <= 1}
                            onClick={() => cartStore.updateQty(item.id, item.qty - 1)}
                            aria-label={`Decrease quantity of ${p?.title || "item"}`}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-bone hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-gold"
                          >
                            &minus;
                          </button>
                          <span className="min-w-6 text-center font-mono text-xs font-semibold text-bone">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            disabled={item.qty >= 10}
                            onClick={() => cartStore.updateQty(item.id, item.qty + 1)}
                            aria-label={`Increase quantity of ${p?.title || "item"}`}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-bone hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-gold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-serif text-sm font-semibold text-gold">
                          <Price value={lineTotal} />
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Area */}
        {cart.length > 0 ? (
          <div className="border-t border-white/10 bg-ink-2/95 px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
            {/* Bundle Note when 2 or more items */}
            {bundleEnabled && cart.reduce((sum, item) => sum + item.qty, 0) >= 2 ? (
              <div className="mb-3 rounded-xl border border-gold/30 bg-gold/10 p-2.5 text-center text-xs text-bone">
                <span>Any 3 perfumes are <Price value={bundlePrice} className="font-semibold text-gold" /> as a bundle. </span>
                <Link
                  href="/bundle"
                  onClick={close}
                  className="inline-block font-semibold text-gold underline underline-offset-2 hover:text-white"
                >
                  Build your bundle →
                </Link>
              </div>
            ) : null}

            {/* Total Row */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-mute">Estimated Total</span>
              <span className="font-serif text-2xl font-semibold text-gold">
                <Price value={estimatedTotal + (intlEnabled && country.code !== "PK" ? country.shipping_pkr ?? 0 : 0)} />
              </span>
            </div>
            {intlEnabled && country.code !== "PK" && country.shipping_pkr ? <p className="mt-1 text-right text-xs text-mute">Includes delivery estimate: <Price value={country.shipping_pkr} /></p> : null}

            <p className="mt-1 text-[11px] leading-relaxed text-mute">
              Delivery and payment are confirmed with you on WhatsApp.
            </p>

            {/* Main Action: Send order on WhatsApp */}
            {orderHref ? (
              <a
                href={orderHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#155D3A]/50 bg-[#155D3A] px-5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
              >
                <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
                </svg>
                <span>Send order on WhatsApp</span>
              </a>
            ) : null}

            {/* Bottom Actions: Clear cart & Just chat with us */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => cartStore.clearCart()}
                className="text-mute hover:text-red-400 py-1 transition-colors"
              >
                Clear cart
              </button>

              {plainChatHref ? (
                <a
                  href={plainChatHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold underline hover:text-gold/80 py-1 transition-colors"
                >
                  Just chat with us ↗
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

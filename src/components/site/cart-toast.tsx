"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeCartToast, cartStore } from "@/lib/site/cart-store";

export function CartToast() {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeCartToast((data) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message: data.message, id: Date.now() });

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, 3500);
    });
  }, []);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-4 z-40 flex items-center gap-3 rounded-xl border border-gold/30 bg-ink-2/95 px-4 py-3 text-xs text-bone shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 md:bottom-8 md:left-8"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <span className="font-medium text-bone">{toast.message}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setToast(null);
          cartStore.openDrawer();
        }}
        className="ml-2 font-semibold text-gold underline decoration-gold/50 underline-offset-2 hover:text-gold/80 hover:decoration-gold transition-colors focus-visible:outline focus-visible:outline-gold"
      >
        View cart
      </button>

      <button
        type="button"
        onClick={() => setToast(null)}
        aria-label="Dismiss"
        className="ml-1 text-mute hover:text-bone text-base leading-none p-1"
      >
        &times;
      </button>
    </div>
  );
}

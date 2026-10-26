"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCartCount } from "@/lib/site/cart-store";

const emptySubscribe = () => () => {};

export function CartBadge({ className = "" }: { className?: string }) {
  const count = useCartCount();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [pulse, setPulse] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current) {
      const timer = setTimeout(() => {
        setPulse(true);
        const resetTimer = setTimeout(() => setPulse(false), 300);
        return () => clearTimeout(resetTimer);
      }, 0);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  if (!mounted || count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[10px] font-bold text-ink shadow transition-transform duration-200 motion-reduce:transition-none ${
        pulse ? "scale-125" : "scale-100"
      } ${className}`}
    >
      {count}
    </span>
  );
}

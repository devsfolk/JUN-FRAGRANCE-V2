"use client";

import { useEffect, useState } from "react";
import { useCartCount } from "@/lib/site/cart-store";

export function CartBadge({ className = "" }: { className?: string }) {
  const count = useCartCount();
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (count > 0 && mounted) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count, mounted]);

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

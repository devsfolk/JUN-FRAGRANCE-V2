"use client";

import { useEffect } from "react";

export function ScrollEnhancer() {
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches === false || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ smoothWheel: true, syncTouch: false, autoRaf: true });
      destroy = () => lenis.destroy();
    });
    return () => { cancelled = true; destroy?.(); };
  }, []);
  return null;
}
"use client";

import { useEffect } from "react";

export function ScrollEnhancer() {
  useEffect(() => {
    const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
    if (hasTouch || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

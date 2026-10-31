import { useSyncExternalStore } from "react";

export type GiftState = { gift: boolean; message: string; recipient: string };
const KEY = "jf_gift_v1";
export const EMPTY_GIFT: GiftState = { gift: false, message: "", recipient: "" };
const EMPTY = EMPTY_GIFT;
let current = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function sanitize(value: unknown): GiftState {
  if (!value || typeof value !== "object") return EMPTY;
  const item = value as Partial<GiftState>;
  return { gift: item.gift === true, message: typeof item.message === "string" ? item.message.slice(0, 150) : "", recipient: typeof item.recipient === "string" ? item.recipient.slice(0, 40) : "" };
}
function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { current = sanitize(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { current = EMPTY; }
}
function emit() { listeners.forEach((listener) => listener()); }
export const giftStore = {
  getSnapshot() { ensureLoaded(); return current; },
  getServerSnapshot() { return EMPTY; },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  update(patch: Partial<GiftState>) {
    ensureLoaded(); current = sanitize({ ...current, ...patch });
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* Storage may be unavailable. */ }
    emit();
  },
};
export function useGift() { return useSyncExternalStore(giftStore.subscribe, giftStore.getSnapshot, giftStore.getServerSnapshot); }

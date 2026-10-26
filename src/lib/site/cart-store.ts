import { useSyncExternalStore } from "react";

export interface CartItem {
  id: string;
  qty: number;
}

const STORAGE_KEY = "jf_cart_v1";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 20;
const MAX_QTY = 10;
const MIN_QTY = 1;

const EMPTY_CART: CartItem[] = [];

let memoryCart: CartItem[] = [];
let hasLoadedFromStorage = false;
let isDrawerOpen = false;

const listeners = new Set<() => void>();
const drawerListeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function emitDrawerChange() {
  for (const listener of drawerListeners) {
    listener();
  }
}

function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: CartItem[] = [];
  const seenIds = new Set<string>();

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      UUID_REGEX.test(item.id.trim()) &&
      !seenIds.has(item.id.trim())
    ) {
      const id = item.id.trim();
      const qtyNum = typeof item.qty === "number" ? Math.floor(item.qty) : 1;
      const qty = Math.max(MIN_QTY, Math.min(MAX_QTY, isNaN(qtyNum) ? 1 : qtyNum));
      seenIds.add(id);
      valid.push({ id, qty });
      if (valid.length >= MAX_ITEMS) break;
    }
  }

  return valid;
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    return sanitizeCart(parsed);
  } catch {
    return EMPTY_CART;
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors or private browsing restrictions
  }
}

function ensureLoaded() {
  if (!hasLoadedFromStorage && typeof window !== "undefined") {
    memoryCart = readStorage();
    hasLoadedFromStorage = true;
  }
}

// Global storage event listener for cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      memoryCart = readStorage();
      emitChange();
    }
  });
}

export const cartStore = {
  getSnapshot(): CartItem[] {
    ensureLoaded();
    return memoryCart;
  },

  getServerSnapshot(): CartItem[] {
    return EMPTY_CART;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  addItem(id: string, qty = 1): { ok: boolean; reason?: "max_items" } {
    ensureLoaded();
    if (!UUID_REGEX.test(id)) return { ok: false };

    const cleanQty = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(qty) || 1));
    const existingIndex = memoryCart.findIndex((item) => item.id === id);

    let next: CartItem[];
    if (existingIndex >= 0) {
      const existing = memoryCart[existingIndex];
      const newQty = Math.min(MAX_QTY, existing.qty + cleanQty);
      next = memoryCart.map((item, idx) => (idx === existingIndex ? { ...item, qty: newQty } : item));
    } else {
      if (memoryCart.length >= MAX_ITEMS) {
        return { ok: false, reason: "max_items" };
      }
      next = [...memoryCart, { id, qty: cleanQty }];
    }

    memoryCart = next;
    writeStorage(next);
    emitChange();
    return { ok: true };
  },

  updateQty(id: string, qty: number) {
    ensureLoaded();
    if (qty <= 0) {
      this.removeItem(id);
      return;
    }
    const cleanQty = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(qty) || 1));
    const next = memoryCart.map((item) => (item.id === id ? { ...item, qty: cleanQty } : item));
    memoryCart = next;
    writeStorage(next);
    emitChange();
  },

  removeItem(id: string) {
    ensureLoaded();
    const next = memoryCart.filter((item) => item.id !== id);
    memoryCart = next;
    writeStorage(next);
    emitChange();
  },

  clearCart() {
    ensureLoaded();
    memoryCart = EMPTY_CART;
    writeStorage(EMPTY_CART);
    emitChange();
  },

  removeInactiveIds(activeIds: Set<string>) {
    ensureLoaded();
    const next = memoryCart.filter((item) => activeIds.has(item.id));
    if (next.length !== memoryCart.length) {
      memoryCart = next;
      writeStorage(next);
      emitChange();
      return true; // some items were removed
    }
    return false;
  },

  // Drawer state
  isDrawerOpen(): boolean {
    return isDrawerOpen;
  },

  getDrawerServerSnapshot(): boolean {
    return false;
  },

  subscribeDrawer(listener: () => void): () => void {
    drawerListeners.add(listener);
    return () => {
      drawerListeners.delete(listener);
    };
  },

  openDrawer() {
    if (!isDrawerOpen) {
      isDrawerOpen = true;
      emitDrawerChange();
    }
  },

  closeDrawer() {
    if (isDrawerOpen) {
      isDrawerOpen = false;
      emitDrawerChange();
    }
  },

  toggleDrawer() {
    isDrawerOpen = !isDrawerOpen;
    emitDrawerChange();
  },
};

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
}

export function useCartCount(): number {
  const items = useCart();
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function useCartDrawer(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const isOpen = useSyncExternalStore(
    cartStore.subscribeDrawer,
    cartStore.isDrawerOpen,
    cartStore.getDrawerServerSnapshot
  );

  return {
    isOpen,
    open: cartStore.openDrawer,
    close: cartStore.closeDrawer,
    toggle: cartStore.toggleDrawer,
  };
}

export interface CartProductDetail {
  id: string;
  title: string;
  slug: string;
  price: number;
  size_ml: number;
  image: string | null;
}

export function buildCartWhatsAppMessage({
  items,
  products,
  siteUrl,
}: {
  items: Array<{ id: string; qty: number }>;
  products: Record<string, CartProductDetail>;
  siteUrl: string;
}): string {
  const lines: string[] = ["Assalam o Alaikum! I would like to order:", ""];

  let total = 0;
  let itemIndex = 1;

  for (const item of items) {
    const p = products[item.id];
    if (!p) continue;
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    lines.push(
      `${itemIndex}. ${p.title} (${p.size_ml} ml) x${item.qty} - Rs. ${lineTotal.toLocaleString("en-PK")}`
    );
    lines.push(`   ${siteUrl}/shop/${p.slug}`);
    itemIndex++;
  }

  lines.push("");
  lines.push(`Estimated total: Rs. ${total.toLocaleString("en-PK")}`);
  lines.push("");
  lines.push("Name:");
  lines.push("City:");
  lines.push("Address:");

  let message = lines.join("\n");

  // Keep final wa.me URL under 2000 chars by dropping per-item links if necessary
  const testUrl = `https://wa.me/923000000000?text=${encodeURIComponent(message)}`;
  if (testUrl.length > 2000) {
    const fallbackLines: string[] = [
      "Assalam o Alaikum! I would like to order:",
      "",
    ];
    let idx = 1;
    for (const item of items) {
      const p = products[item.id];
      if (!p) continue;
      const lineTotal = p.price * item.qty;
      fallbackLines.push(
        `${idx}. ${p.title} (${p.size_ml} ml) x${item.qty} - Rs. ${lineTotal.toLocaleString("en-PK")}`
      );
      idx++;
    }
    fallbackLines.push("");
    fallbackLines.push(`Estimated total: Rs. ${total.toLocaleString("en-PK")}`);
    fallbackLines.push("");
    fallbackLines.push("Name:");
    fallbackLines.push("City:");
    fallbackLines.push("Address:");
    message = fallbackLines.join("\n");
  }

  return message;
}

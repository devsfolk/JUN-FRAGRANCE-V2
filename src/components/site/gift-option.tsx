"use client";

import { Price } from "./ui/price";
import { giftStore, useGift } from "@/lib/site/gift-store";

export function GiftOption({ enabled, includesCard, includesBag, wrapPrice }: { enabled: boolean; includesCard: boolean; includesBag: boolean; wrapPrice: number | null }) {
  const gift = useGift();
  if (!enabled) return null;
  return <fieldset className="rounded-xl border border-white/10 p-4 text-bone">
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={gift.gift} onChange={(event) => giftStore.update({ gift: event.target.checked })} />This is a gift</label>
    {gift.gift ? <div className="mt-3 space-y-3">
      {includesCard ? <label className="block text-xs">Message card<textarea className="mt-1 min-h-20 w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm" maxLength={150} value={gift.message} onChange={(event) => giftStore.update({ message: event.target.value.slice(0, 150) })} /></label> : null}
      <label className="block text-xs">Recipient name<input className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm" maxLength={40} value={gift.recipient} onChange={(event) => giftStore.update({ recipient: event.target.value.slice(0, 40) })} /></label>
      {wrapPrice !== null ? <p className="text-xs">Gift packaging: <Price value={wrapPrice} /></p> : null}
      {includesBag ? <p className="text-xs">A gift bag is included.</p> : null}
    </div> : null}
  </fieldset>;
}

export function whatsappNumber(settings: Record<string, string | undefined>) {
  const number = settings.whatsapp_number;
  return number && /^\d{8,15}$/.test(number) ? number : null;
}

export function whatsappLink(number: string | null, message: string) {
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function socialUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function productWhatsAppMessage(title: string, sizeMl: number, siteUrl: string, slug: string, qty = 1) {
  const qtySuffix = qty > 1 ? ` x${qty}` : "";
  return `Assalam o Alaikum! I want to order ${title} (${sizeMl}ml)${qtySuffix} - ${new URL(`/shop/${slug}`, siteUrl).toString()}`;
}

export function bundleWhatsAppMessage(
  bundlePrice: number,
  items: Array<{ title: string; size_ml: number; slug: string }>,
  siteUrl: string,
  gift?: { details: GiftOrderDetails; includesCard: boolean; wrapPricePkr: number | null }
) {
  const cleanBase = siteUrl.replace(/\/$/, "");
  const lines = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.title} (${item.size_ml} ml)\n   ${cleanBase}/shop/${item.slug}`
    )
    .join("\n");
  const formattedPrice = bundlePrice.toLocaleString("en-PK");
  const giftActive = gift?.details.gift === true;
  const giftLines = giftActive ? [
    `Estimated total: Rs. ${(bundlePrice + (gift.wrapPricePkr ?? 0)).toLocaleString("en-PK")}`,
    ...(gift.wrapPricePkr !== null ? [`Gift packaging: Rs. ${gift.wrapPricePkr.toLocaleString("en-PK")}`] : []),
    ...giftOrderLines(gift.details, gift.includesCard),
  ] : [];
  const contactLines = giftActive ? giftLines : ["Name:", "City:", "Address:"];
  return `Assalam o Alaikum! I would like to order a bundle:\n\nBundle: any 3 perfumes - Rs. ${formattedPrice}\n${lines}\n\n${contactLines.join("\n")}`;
}

import { giftOrderLines, type GiftOrderDetails } from "./intl-order-message";


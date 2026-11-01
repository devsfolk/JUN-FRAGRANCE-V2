import { formatMoney } from "./intl-pricing";

export type GiftOrderDetails = { gift: boolean; message: string; recipient: string };
export type IntlOrderLine = { title: string; quantity: number; localAmount: number; url?: string };

export function giftOrderLines(gift: GiftOrderDetails, includesCard: boolean): string[] {
  if (!gift.gift) return [];
  return [
    "GIFT: yes. Please do not show any prices on the parcel or on any paperwork inside it.",
    ...(includesCard && gift.message.trim() ? [`Gift message: ${gift.message.trim().slice(0, 150)}`] : []),
    ...(gift.recipient.trim() ? [`Recipient name: ${gift.recipient.trim().slice(0, 40)}`] : []),
    "Recipient address:",
    "Buyer name:",
  ];
}

export function appendGiftToOrderMessage(message: string, gift: GiftOrderDetails, includesCard: boolean, wrapPricePkr: number | null, itemsSubtotalPkr = 0): string {
  if (!gift.gift) return message;
  const packaging = wrapPricePkr !== null ? `Gift packaging: ${formatMoney(wrapPricePkr, "PKR")}` : null;
  return [message, `Estimated total: ${formatMoney(itemsSubtotalPkr + (wrapPricePkr ?? 0), "PKR")}`, ...(packaging ? [packaging] : []), ...giftOrderLines(gift, includesCard)].join("\n");
}

export function buildInternationalOrderMessage(input: {
  country: string;
  currency: string;
  lines: IntlOrderLine[];
  subtotal: number;
  delivery: number;
  gift?: GiftOrderDetails;
  includesCard?: boolean;
}): string {
  const itemLines = input.lines.map((item, index) => `${index + 1}. ${item.title} x${item.quantity} — ${formatMoney(item.localAmount, input.currency)}${item.url ? `\n   ${item.url}` : ""}`);
  const required = [
    "Assalam o Alaikum! I would like to order:",
    `Delivery country: ${input.country} | Currency: ${input.currency}`,
    ...itemLines,
    `Subtotal: ${formatMoney(input.subtotal, input.currency)}`,
    `Delivery: ${formatMoney(input.delivery, input.currency)}`,
    `Total (estimate): ${formatMoney(input.subtotal + input.delivery, input.currency)}`,
    "Final amount, payment method and delivery time are confirmed on WhatsApp.",
    "Import duties and taxes of your country, if any, are paid by the receiver.",
    ...giftOrderLines(input.gift ?? { gift: false, message: "", recipient: "" }, input.includesCard ?? false),
  ];
  let message = required.join("\n");
  // Keep all mandatory delivery and gift lines; shorten item descriptions first.
  for (let limit = 100; message.length > 1800 && limit >= 12; limit -= 10) {
    const shortened = itemLines.map((line, index) => `${index + 1}. ${input.lines[index].title.slice(0, limit)} x${input.lines[index].quantity} — ${formatMoney(input.lines[index].localAmount, input.currency)}`);
    message = ["Assalam o Alaikum! I would like to order:", `Delivery country: ${input.country} | Currency: ${input.currency}`, ...shortened, `Subtotal: ${formatMoney(input.subtotal, input.currency)}`, `Delivery: ${formatMoney(input.delivery, input.currency)}`, `Total (estimate): ${formatMoney(input.subtotal + input.delivery, input.currency)}`, "Final amount, payment method and delivery time are confirmed on WhatsApp.", "Import duties and taxes of your country, if any, are paid by the receiver.", ...giftOrderLines(input.gift ?? { gift: false, message: "", recipient: "" }, input.includesCard ?? false)].join("\n");
  }
  if (message.length > 1800) {
    const compactItems = input.lines.map((item, index) => `${index + 1}. Perfume x${item.quantity} — ${formatMoney(item.localAmount, input.currency)}`);
    message = ["Assalam o Alaikum! I would like to order:", `Delivery country: ${input.country} | Currency: ${input.currency}`, ...compactItems, `Subtotal: ${formatMoney(input.subtotal, input.currency)}`, `Delivery: ${formatMoney(input.delivery, input.currency)}`, `Total (estimate): ${formatMoney(input.subtotal + input.delivery, input.currency)}`, "Final amount, payment method and delivery time are confirmed on WhatsApp.", "Import duties and taxes of your country, if any, are paid by the receiver.", ...giftOrderLines(input.gift ?? { gift: false, message: "", recipient: "" }, input.includesCard ?? false)].join("\n");
  }
  return message;
}

export async function convertOrderAmounts(amounts: number[], quoteMany: (amounts: number[]) => Promise<number[] | null>): Promise<number[] | null> {
  const converted: number[] = [];
  for (let start = 0; start < amounts.length; start += 20) {
    const chunk = amounts.slice(start, start + 20);
    const result = await quoteMany(chunk);
    if (!result) return null;
    converted.push(...result);
  }
  return converted;
}

export async function createInternationalOrderMessage(input: {
  country: string;
  currency: string;
  items: Array<{ title: string; quantity: number; pkrAmount: number; url?: string }>;
  shippingPkr: number;
  quoteMany: (amounts: number[]) => Promise<number[] | null>;
  gift?: GiftOrderDetails;
  includesCard?: boolean;
  giftWrapPricePkr?: number | null;
}): Promise<string | null> {
  const items = [...input.items];
  if (input.gift?.gift && input.giftWrapPricePkr != null) items.push({ title: "Gift packaging", quantity: 1, pkrAmount: input.giftWrapPricePkr });
  const amounts = [...items.map((item) => item.pkrAmount), input.shippingPkr];
  const prices = await convertOrderAmounts(amounts, input.quoteMany);
  if (!prices) return null;
  const delivery = prices[prices.length - 1];
  const lines = items.map((item, index) => ({ title: item.title, quantity: item.quantity, localAmount: prices[index], url: item.url }));
  const subtotal = prices.slice(0, items.length).reduce((sum, amount) => sum + amount, 0);
  return buildInternationalOrderMessage({ country: input.country, currency: input.currency, lines, subtotal, delivery, gift: input.gift, includesCard: input.includesCard });
}

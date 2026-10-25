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

export function productWhatsAppMessage(title: string, sizeMl: number, siteUrl: string, slug: string) {
  return `Assalam o Alaikum! I want to order ${title} (${sizeMl}ml) - ${new URL(`/shop/${slug}`, siteUrl).toString()}`;
}
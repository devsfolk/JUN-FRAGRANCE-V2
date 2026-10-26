import Image from "next/image";
import Link from "next/link";
import { Price } from "./price";
import {
  whatsappLink,
  productWhatsAppMessage,
} from "@/lib/site/whatsapp";

export type ProductCardItem = {
  id: string;
  title: string;
  slug: string;
  images: string[];
  inspired_by: string | null;
  price: number;
  compare_at_price: number | null;
  size_ml: number;
  accent_color: string | null;
};

interface ProductCardProps {
  product: ProductCardItem;
  whatsappNumber: string | null;
  siteUrl: string;
  priority?: boolean;
}

export function ProductCard({
  product,
  whatsappNumber,
  siteUrl,
  priority = false,
}: ProductCardProps) {
  const thumb = product.images?.[0];
  const accent = product.accent_color?.trim() || "#C9A66B";
  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : null;

  const orderUrl = whatsappNumber
    ? whatsappLink(
        whatsappNumber,
        productWhatsAppMessage(
          product.title,
          product.size_ml,
          siteUrl,
          product.slug
        )
      )
    : null;

  return (
    <div
      className="group relative flex w-full flex-col justify-between rounded-2xl border bg-ink-2/70 p-3.5 transition-colors duration-300"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 25%, rgba(255,255,255,0.08))`,
      }}
    >
      {/* Soft accent glow behind card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{
          background: `radial-gradient(circle at 50% 25%, color-mix(in srgb, ${accent} 16%, transparent) 0%, transparent 70%)`,
        }}
      />

      {/* Clickable Card Body linking to /shop/<slug> */}
      <Link
        href={`/shop/${product.slug}`}
        className="flex flex-col rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {/* Photo Frame in 4:5 aspect */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/40">
          {thumb ? (
            <Image
              src={thumb}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-mute">
              JUN.FRAGRANCE
            </div>
          )}

          {/* Gold Save X% badge calculated from compare_at_price */}
          {discountPercent ? (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-gold/40 bg-ink/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
              Save {discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Title, Inspired by, and Price */}
        <div className="mt-3.5 flex flex-col items-start text-left">
          <h3 className="line-clamp-1 font-serif text-lg font-medium text-bone transition-colors group-hover:text-gold sm:text-xl">
            {product.title}
          </h3>

          {product.inspired_by ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-mute">
              Inspired by {product.inspired_by}
            </p>
          ) : null}

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gold">
              <Price value={product.price} />
            </span>

            {product.compare_at_price &&
            product.compare_at_price > product.price ? (
              <span className="text-xs text-mute line-through">
                <Price value={product.compare_at_price} />
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* WhatsApp Order Button (min 44px tap target, prefilled) */}
      {orderUrl ? (
        <div className="mt-4 pt-1">
          <a
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Order ${product.title} on WhatsApp`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#155D3A]/40 bg-[#155D3A]/90 px-4 text-xs font-semibold text-white transition-colors hover:bg-[#155D3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
            </svg>
            <span>Order on WhatsApp</span>
          </a>
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Jun.fragrance",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-4 py-24 text-center">
      {/* Large decorative number */}
      <p className="font-serif text-[7rem] font-normal leading-none text-gold/20 sm:text-[10rem]" aria-hidden="true">
        404
      </p>

      <h1 className="mt-4 font-serif text-2xl font-normal text-bone sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-mute">
        The page you&apos;re looking for has moved, been removed, or never existed.
      </p>

      <Link
        href="/shop"
        id="not-found-shop-link"
        className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-7 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
      >
        Browse our shop
        <span aria-hidden="true">→</span>
      </Link>

      <Link
        href="/"
        className="mt-4 text-xs text-mute underline underline-offset-4 transition-colors hover:text-bone"
      >
        Back to home
      </Link>
    </div>
  );
}

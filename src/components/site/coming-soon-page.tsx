import type { Metadata } from "next";
import { Container } from "./ui/container";

export function comingSoonMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}

export function ComingSoonPage({ title }: { title: string }) {
  return <section className="flex min-h-[75dvh] items-center py-28"><Container><p className="mb-4 text-[10px] font-semibold uppercase tracking-[.3em] text-gold">JUN.FRAGRANCE</p><h1 className="font-serif text-6xl font-normal text-bone md:text-8xl">{title}</h1><p className="mt-5 max-w-lg text-sm leading-7 text-mute">Coming soon.</p></Container></section>;
}
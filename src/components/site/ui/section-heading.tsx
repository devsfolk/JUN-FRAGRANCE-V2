import Link from "next/link";
import { Container } from "./container";

type Props = { eyebrow: string; title: string; href?: string; linkLabel?: string; className?: string };
export function SectionHeading({ eyebrow, title, href, linkLabel = "View all", className = "" }: Props) {
  return <Container className={`mb-8 flex items-end justify-between gap-4 md:mb-12 ${className}`}><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.28em] text-gold">{eyebrow}</p><h2 className="font-serif text-4xl font-normal leading-none text-bone md:text-6xl">{title}</h2></div>{href ? <Link className="min-h-11 shrink-0 self-end py-3 text-xs font-semibold uppercase tracking-[.16em] text-bone/75 underline decoration-gold/60 underline-offset-8 hover:text-gold" href={href}>{linkLabel}</Link> : null}</Container>;
}
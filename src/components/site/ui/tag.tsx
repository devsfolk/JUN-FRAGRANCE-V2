export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex min-h-8 items-center rounded-full border border-gold/40 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-gold">{children}</span>;
}
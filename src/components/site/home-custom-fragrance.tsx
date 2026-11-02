import Link from "next/link";
import { Container } from "@/components/site/ui/container";
import { getPublicSettings, parseCustomFragranceSettings } from "@/lib/site/public-data";

export async function HomeCustomFragrance() {
  const settings = parseCustomFragranceSettings(await getPublicSettings());
  if (!settings.enabled) return null;
  return <section className="overflow-hidden border-t border-white/10 bg-ink py-10 sm:py-14">
    <Container className="max-w-6xl"><div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-ink-2/70 p-5 sm:p-8">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-gold">Make it personal</p><h2 className="mt-2 font-serif text-2xl text-bone sm:text-3xl">Your own fragrance</h2><p className="mt-2 max-w-xl text-sm leading-6 text-bone/70">Tell us what you like and we make it for you.</p><Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-ink" href="/custom">Start your request</Link></div>
      <div aria-hidden="true" className="custom-fragrance-bottle relative h-28 w-14 shrink-0 [container-type:inline-size] motion-reduce:animate-none sm:h-36 sm:w-20" style={{ animation: "customBottleFloat 7s ease-in-out infinite" }}><div className="absolute inset-0 border border-[#C9A66B]/60 bg-[linear-gradient(to_bottom,#CFE36A_0%,#CFE36A_33.33%,#4FB3D9_33.33%,#4FB3D9_66.66%,#8B5A2B_66.66%,#8B5A2B_100%)] shadow-[0_8px_28px_rgba(201,166,107,.16)]" style={{ borderRadius: "25cqw" }} /></div>
    </div></Container>
    <style>{`@keyframes customBottleFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@media(prefers-reduced-motion:reduce){.custom-fragrance-bottle{animation:none!important}}`}</style>
  </section>;
}

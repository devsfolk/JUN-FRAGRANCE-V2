import Link from "next/link";
import Image from "next/image";
import { Container } from "./ui/container";
import { whatsappLink } from "@/lib/site/whatsapp";
import type { SiteLogo } from "@/lib/site/public-data";

const footerLinks = [{ label: "Shop", href: "/shop" }, { label: "About", href: "/about" }, { label: "Journal", href: "/journal" }, { label: "Contact", href: "/contact" }, { label: "FAQ", href: "/faq" }, { label: "Terms & Conditions", href: "/terms-and-conditions" }, { label: "Privacy Policy", href: "/privacy-policy" }];
const socials = [{ key: "social_instagram", label: "Instagram" }, { key: "social_tiktok", label: "TikTok" }, { key: "social_facebook", label: "Facebook" }, { key: "social_youtube", label: "YouTube" }] as const;

export function SiteFooter({
  settings,
  whatsappNumber,
  siteLogo,
}: {
  settings: Record<string, string | undefined>;
  whatsappNumber: string | null;
  siteLogo?: SiteLogo | null;
}) {
  const chat = whatsappLink(whatsappNumber, "Assalam o Alaikum! I would like to know more about Jun.fragrance.");
  return <footer className="border-t border-white/10 bg-ink-2 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 md:pt-20">
    <Container><div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr] md:gap-12">
      <div>
        <Link className="inline-block" href="/">
          {siteLogo?.url ? (
            <Image
              src={siteLogo.url}
              alt={siteLogo.alt || "Jun.fragrance"}
              width={0}
              height={0}
              sizes="(max-width: 768px) 160px, 220px"
              priority
              className="h-[28px] md:h-[36px] w-auto max-w-[180px] md:max-w-[240px] object-contain"
            />
          ) : (
            <span className="font-serif text-4xl text-bone">Jun.fragrance</span>
          )}
        </Link>
        <p className="mt-3 font-script text-2xl text-gold">More than just a fragrance.</p>
        <p className="mt-6 text-xs uppercase tracking-[.18em] text-mute">Crafted in Pakistan</p>
      </div>
      <nav aria-label="Footer navigation"><h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Explore</h2><ul className="grid grid-cols-2 gap-x-4 gap-y-2">{footerLinks.map((link) => <li key={link.href}><Link className="inline-flex min-h-11 items-center text-sm text-bone/75 hover:text-gold" href={link.href}>{link.label}</Link></li>)}</ul></nav>
      <div><h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Stay connected</h2><div className="flex flex-wrap gap-2">{socials.map((social) => { const url = settings[social.key]; if (!url) return null; return <a aria-label={social.label} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs text-bone hover:border-gold hover:text-gold" href={url} key={social.key} rel="noreferrer" target="_blank">{social.label}</a>; })}</div>{chat ? <a className="mt-4 inline-flex min-h-11 items-center text-sm text-bone/75 underline decoration-gold underline-offset-4 hover:text-gold" href={chat}>Chat on WhatsApp ↗</a> : null}</div>
    </div><div className="mt-12 border-t border-white/10 pt-5 space-y-2"><p className="text-[10px] leading-relaxed text-mute">Jun.fragrance is an independent brand. Names in &ldquo;inspired by&rdquo; lines belong to their respective owners and are not affiliated with Jun.fragrance.</p><p className="text-[10px] uppercase tracking-[.14em] text-mute">© {new Date().getFullYear()} Jun.fragrance</p></div></Container>
  </footer>;
}
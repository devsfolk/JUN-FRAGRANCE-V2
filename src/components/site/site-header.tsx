"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { whatsappLink } from "@/lib/site/whatsapp";

const links = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "About", href: "/about" }, { label: "Journal", href: "/journal" }, { label: "Contact", href: "/contact" }];

export function SiteHeader({ whatsappNumber }: { whatsappNumber: string | null }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const update = () => setSolid(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const chat = whatsappLink(whatsappNumber, "Assalam o Alaikum! I would like to know more about Jun.fragrance.");
  return <>
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${solid || open ? "border-white/10 bg-ink/95 backdrop-blur-md" : "border-transparent bg-ink/20"}`}>
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link aria-label="Jun.fragrance home" className="font-serif text-[1.7rem] leading-none text-bone" href="/">Jun.fragrance</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">{links.map((link) => <Link className="min-h-11 py-3 text-xs font-medium uppercase tracking-[.16em] text-bone/75 transition-colors hover:text-gold" href={link.href} key={link.href}>{link.label}</Link>)}</nav>
        <button aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-bone/25 text-bone md:hidden" onClick={() => setOpen((value) => !value)} type="button"><span aria-hidden="true" className="text-xl">{open ? "×" : "☰"}</span></button>
      </div>
    </header>
    {open ? <div className="fixed inset-0 z-30 flex min-h-dvh flex-col justify-center bg-ink px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))] md:hidden"><nav aria-label="Mobile navigation" className="container-site flex flex-col">{links.map((link, index) => <Link className="min-h-[4.25rem] border-b border-white/10 py-2 font-serif text-5xl text-bone" href={link.href} key={link.href} onClick={() => setOpen(false)}><span className="mr-3 align-middle font-sans text-[10px] tracking-widest text-gold">0{index + 1}</span>{link.label}</Link>)}</nav>{chat ? <div className="container-site mt-8"><Button href={chat} onClick={() => setOpen(false)}>Chat on WhatsApp <span aria-hidden="true">↗</span></Button></div> : null}</div> : null}
  </>;
}
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { whatsappLink } from "@/lib/site/whatsapp";
import { cartStore } from "@/lib/site/cart-store";
import { CartBadge } from "./cart-badge";
import type { SiteLogo } from "@/lib/site/public-data";

export function SiteHeader({
  whatsappNumber,
  siteLogo,
  logoShowText = false,
  bundleEnabled = true,
}: {
  whatsappNumber: string | null;
  siteLogo?: SiteLogo | null;
  logoShowText?: boolean;
  bundleEnabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(bundleEnabled ? [{ label: "Bundle", href: "/bundle", isSpecial: true }] : []),
    { label: "About", href: "/about" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" },
  ];
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
        <Link aria-label="Jun.fragrance home" className="flex items-center gap-2.5 min-w-0" href="/">
          {siteLogo?.url ? (
            <>
              <Image
                src={siteLogo.url}
                alt={siteLogo.alt || "Jun.fragrance"}
                width={0}
                height={0}
                sizes="(max-width: 639px) 120px, 200px"
                priority
                className="h-[28px] md:h-[36px] w-auto max-w-[120px] sm:max-w-[200px] object-contain shrink-0"
              />
              {logoShowText ? (
                <span className="hidden min-[360px]:inline-block font-serif text-[1.35rem] sm:text-[1.7rem] leading-none text-bone truncate">
                  Jun.fragrance
                </span>
              ) : null}
            </>
          ) : (
            <span className="font-serif text-[1.7rem] leading-none text-bone">Jun.fragrance</span>
          )}
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Main navigation" className="hidden items-center gap-8 mr-4 md:flex">
            {navLinks.map((link) => (
              <Link
                className={`min-h-11 py-3 text-xs uppercase tracking-[.16em] transition-colors ${
                  link.isSpecial
                    ? "font-semibold text-gold hover:text-white"
                    : "font-medium text-bone/75 hover:text-gold"
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {whatsappNumber ? (
            <button
              type="button"
              onClick={() => cartStore.openDrawer()}
              aria-label="View shopping cart"
              className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-bone/80 hover:text-gold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <CartBadge className="absolute right-0.5 top-0.5" />
            </button>
          ) : null}
          <button aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-bone/25 text-bone md:hidden" onClick={() => setOpen((value) => !value)} type="button"><span aria-hidden="true" className="text-xl">{open ? "×" : "☰"}</span></button>
        </div>
      </div>
    </header>
    {open ? (
      <div className="fixed inset-0 z-30 flex min-h-dvh flex-col justify-center bg-ink px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))] md:hidden">
        <nav aria-label="Mobile navigation" className="container-site flex flex-col">
          {navLinks.map((link, index) => (
            <Link
              className={`min-h-[4.25rem] border-b border-white/10 py-2 font-serif text-5xl ${
                link.isSpecial ? "text-gold" : "text-bone"
              }`}
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              <span className="mr-3 align-middle font-sans text-[10px] tracking-widest text-gold">
                0{index + 1}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
        {chat ? (
          <div className="container-site mt-8">
            <Button href={chat} onClick={() => setOpen(false)}>
              Chat on WhatsApp <span aria-hidden="true">↗</span>
            </Button>
          </div>
        ) : null}
      </div>
    ) : null}
  </>;
}

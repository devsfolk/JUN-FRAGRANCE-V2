"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/site/whatsapp";

export function FloatingWhatsApp({ whatsappNumber }: { whatsappNumber: string | null }) {
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { threshold: 0.1 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Hide floating WhatsApp button on product detail pages (/shop/<slug>) to prevent overlapping the sticky order bar
  const isProductPage = pathname?.startsWith("/shop/") && pathname.split("/").filter(Boolean).length === 2;

  const href = whatsappLink(whatsappNumber, "Assalam o Alaikum! I would like to know more about Jun.fragrance.");
  if (!href || !show || isProductPage) return null;

  return (
    <a
      aria-label="Chat with Jun.fragrance on WhatsApp"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-30 grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-[#155D3A] text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:right-8"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.25 22l5.12-1.34A9.95 9.95 0 1 0 12.04 2Zm0 18.1a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.04.8.81-2.97-.2-.31a8.18 8.18 0 1 1 6.88 3.8Zm4.49-6.13c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.39.1-.52.11-.1.25-.29.37-.43.13-.14.17-.25.25-.42.09-.17.05-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.3 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
      </svg>
    </a>
  );
}
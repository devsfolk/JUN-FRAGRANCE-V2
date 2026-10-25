import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Pinyon_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", variable: "--font-cormorant" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-manrope" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-pinyon" });

export const metadata: Metadata = { title: { default: "Jun.fragrance", template: "%s | Jun.fragrance" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={`${cormorant.variable} ${manrope.variable} ${pinyon.variable}`} lang="en-PK"><body>{children}</body></html>;
}
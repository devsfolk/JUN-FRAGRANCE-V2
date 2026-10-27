import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Pinyon_Script } from "next/font/google";
import { getPublicSettings, parseSiteFavicon } from "@/lib/site/public-data";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-manrope",
});

const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-pinyon",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const favicon = parseSiteFavicon(settings.site_favicon);
  const iconUrl = favicon?.url || "/fallback-icon.png";
  const appleUrl = favicon?.url || "/fallback-apple-icon.png";

  const google = settings.google_site_verification?.trim();
  const bing = settings.bing_site_verification?.trim();

  const verification: Record<string, string> = {};
  if (google) verification.google = google;
  if (bing) verification.bing = bing;

  return {
    metadataBase: new URL(siteUrl),
    icons: {
      icon: [
        { url: iconUrl, sizes: "32x32", type: "image/png" },
        { url: iconUrl, sizes: "192x192", type: "image/png" },
        { url: iconUrl, sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: appleUrl, sizes: "180x180", type: "image/png" },
      ],
    },
    title: {
      default: "Jun.fragrance | Premium Perfumes in Pakistan",
      template: "%s | Jun.fragrance",
    },
    description:
      "Premium perfumes and long-lasting fragrances crafted for Pakistan. Explore signature scents with seamless WhatsApp ordering.",
    openGraph: {
      title: "Jun.fragrance | Premium Perfumes in Pakistan",
      description:
        "Premium perfumes and long-lasting fragrances crafted for Pakistan.",
      url: siteUrl,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Jun.fragrance | Premium Perfumes in Pakistan",
      description:
        "Premium perfumes and long-lasting fragrances crafted for Pakistan.",
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${cormorant.variable} ${manrope.variable} ${pinyon.variable}`}
      lang="en-PK"
    >
      <body>{children}</body>
    </html>
  );
}
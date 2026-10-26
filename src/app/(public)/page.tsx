import type { Metadata } from "next";
import { HeroSection } from "@/components/site/hero-section";
import { CategoriesSection } from "@/components/site/categories-section";
import { PicksSection } from "@/components/site/picks-section";
import { StorySection } from "@/components/site/story-section";
import { ReviewsSection } from "@/components/site/reviews-section";
import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { JsonLd, homeJsonLd } from "@/lib/site/json-ld";
import { getPublicSettings } from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber, socialUrl } from "@/lib/site/whatsapp";

export const metadata: Metadata = {
  title: "Jun.fragrance | Premium Perfumes in Pakistan",
  description:
    "Premium fragrances crafted for the modern you. Long-lasting, inspired scents made for people who want to stand out.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com",
  },
  openGraph: {
    title: "Jun.fragrance | Premium Perfumes in Pakistan",
    description:
      "Premium fragrances crafted for the modern you. Bold. Elegant. Unforgettable.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com",
    siteName: "Jun.fragrance",
    locale: "en_PK",
    type: "website",
  },
};

export default async function HomePage() {
  const rawSettings = await getPublicSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const number = extractWhatsappNumber(rawSettings);

  const socials = [
    rawSettings.social_instagram ? socialUrl(rawSettings.social_instagram) : null,
    rawSettings.social_tiktok ? socialUrl(rawSettings.social_tiktok) : null,
    rawSettings.social_facebook ? socialUrl(rawSettings.social_facebook) : null,
    rawSettings.social_youtube ? socialUrl(rawSettings.social_youtube) : null,
  ].filter((s): s is string => Boolean(s));

  const ldData = homeJsonLd({
    siteUrl,
    whatsappNumber: number,
    socialUrls: socials,
    businessAddress: rawSettings.business_address,
    businessCity: rawSettings.business_city,
    businessPhone: rawSettings.business_phone_display,
  });

  return (
    <>
      <JsonLd data={ldData} />
      <HeroSection />
      <CategoriesSection />
      <PicksSection />
      <StorySection />
      <ReviewsSection />
      <ClosingCtaSection />
    </>
  );
}

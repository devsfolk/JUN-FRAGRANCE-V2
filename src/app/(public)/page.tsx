import type { Metadata } from "next";
import { HeroSection } from "@/components/site/hero-section";
import { CategoriesSection } from "@/components/site/categories-section";
import { PicksSection } from "@/components/site/picks-section";
import { StorySection } from "@/components/site/story-section";
import { ReviewsSection } from "@/components/site/reviews-section";
import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { JournalPlacement } from "@/components/site/journal-placement";
import { JsonLd, homeJsonLd } from "@/lib/site/json-ld";
import { getPublicSettings, getPageSEO } from "@/lib/site/public-data";
import { whatsappNumber as extractWhatsappNumber, socialUrl } from "@/lib/site/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const [pageSeo] = await Promise.all([getPageSEO("home")]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const title = pageSeo?.seo_title?.trim() || "Jun.fragrance | Premium Perfumes in Pakistan";
  const description =
    pageSeo?.seo_description?.trim() ||
    "Premium fragrances crafted for the modern you. Long-lasting, inspired scents made for people who want to stand out.";
  const ogImage = pageSeo?.og_image_url?.trim() || `${siteUrl}/hero/scene-1.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: "Jun.fragrance",
      locale: "en_PK",
      type: "website",
      images: [{ url: ogImage }],
    },
  };
}

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
      <JournalPlacement placement="home" />
      <ClosingCtaSection />
    </>
  );
}

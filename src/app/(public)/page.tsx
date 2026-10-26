import type { Metadata } from "next";
import { HeroSection } from "@/components/site/hero-section";
import { CategoriesSection } from "@/components/site/categories-section";
import { PicksSection } from "@/components/site/picks-section";
import { StorySection } from "@/components/site/story-section";
import { ReviewsSection } from "@/components/site/reviews-section";
import { ClosingCtaSection } from "@/components/site/closing-cta-section";

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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <PicksSection />
      <StorySection />
      <ReviewsSection />
      <ClosingCtaSection />
    </>
  );
}

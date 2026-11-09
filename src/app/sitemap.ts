import type { MetadataRoute } from "next";
import { getAllActiveSlugs, getAllActiveBlogSlugs, getBundleSettings, getPublicSettings, isFinderEnabled, parseCustomFragranceSettings } from "@/lib/site/public-data";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  // Static routes (exclude /dashboard)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/delivery`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/faq`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/journal`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const [{ products, categories }, blogPosts, bundleSettings, settings, finderEnabled] = await Promise.all([
      getAllActiveSlugs(),
      getAllActiveBlogSlugs(),
      getBundleSettings(),
      getPublicSettings(),
      isFinderEnabled(),
    ]);

    const bundleEntries: MetadataRoute.Sitemap = bundleSettings.enabled
      ? [
          {
            url: `${siteUrl}/bundle`,
            changeFrequency: "weekly",
            priority: 0.9,
          },
        ]
      : [];
    const giftEntries: MetadataRoute.Sitemap = settings.gift_enabled !== "false" && settings.gift_enabled !== "0"
      ? [{ url: `${siteUrl}/gifts`, changeFrequency: "monthly", priority: 0.7 }]
      : [];
    const finderEntries: MetadataRoute.Sitemap = finderEnabled ? [{ url: `${siteUrl}/perfume-finder`, changeFrequency: "monthly", priority: 0.6 }] : [];
    const customEntries: MetadataRoute.Sitemap = parseCustomFragranceSettings(settings).enabled ? [{ url: `${siteUrl}/custom`, changeFrequency: "monthly", priority: 0.7 }] : [];

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      ...(cat.updated_at ? { lastModified: new Date(cat.updated_at) } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
      images: cat.image_url ? [cat.image_url] : undefined,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${siteUrl}/shop/${prod.slug}`,
      ...(prod.updated_at ? { lastModified: new Date(prod.updated_at) } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
      images: prod.images?.length ? prod.images : undefined,
    }));

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${siteUrl}/journal/${post.slug}`,
      ...(post.published_at ? { lastModified: new Date(post.published_at) } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...bundleEntries, ...giftEntries, ...finderEntries, ...customEntries, ...categoryEntries, ...productEntries, ...blogEntries];
  } catch {
    return staticRoutes;
  }
}

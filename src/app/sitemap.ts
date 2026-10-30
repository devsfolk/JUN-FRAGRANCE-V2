import type { MetadataRoute } from "next";
import { getAllActiveSlugs, getAllActiveBlogSlugs, getBundleSettings } from "@/lib/site/public-data";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  const now = new Date();

  // Static routes (exclude /dashboard)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const [{ products, categories }, blogPosts, bundleSettings] = await Promise.all([
      getAllActiveSlugs(),
      getAllActiveBlogSlugs(),
      getBundleSettings(),
    ]);

    const bundleEntries: MetadataRoute.Sitemap = bundleSettings.enabled
      ? [
          {
            url: `${siteUrl}/bundle`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.9,
          },
        ]
      : [];

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${siteUrl}/shop/${prod.slug}`,
      lastModified: prod.updated_at ? new Date(prod.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${siteUrl}/journal/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...bundleEntries, ...categoryEntries, ...productEntries, ...blogEntries];
  } catch {
    return staticRoutes;
  }
}

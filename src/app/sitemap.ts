import type { MetadataRoute } from "next";
import { getAllActiveSlugs } from "@/lib/site/public-data";

export const revalidate = 3600; // hourly revalidation for dynamic sitemap

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
  ];

  try {
    const { products, categories } = await getAllActiveSlugs();

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

    return [...staticRoutes, ...categoryEntries, ...productEntries];
  } catch {
    return staticRoutes;
  }
}

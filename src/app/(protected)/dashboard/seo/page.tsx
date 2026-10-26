import { requireAdmin } from "@/lib/auth/require-admin";
import { SeoManager, type PageSeoItem, type SeoAuditData } from "./seo-manager";

export const dynamic = "force-dynamic";

const pageKeys = ["home", "shop", "about", "contact", "journal", "faq"] as const;

export default async function SeoDashboardPage() {
  const { supabase } = await requireAdmin();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";

  const [pagesSeoRes, productsRes, categoriesRes, settingsRes] = await Promise.all([
    supabase.from("jf_pages_seo").select("page_key,seo_title,seo_description,og_image_url"),
    supabase.from("jf_products").select("id,title,seo_title,seo_description,images,category_id,is_active"),
    supabase.from("jf_categories").select("id,name,seo_title,seo_description,is_active"),
    supabase.from("jf_settings").select("key,value").in("key", ["google_site_verification", "bing_site_verification"]),
  ]);

  const existingPages = pagesSeoRes.data ?? [];
  const existingMap = new Map(existingPages.map((p) => [p.page_key, p]));

  const initialPages: PageSeoItem[] = pageKeys.map((key) => {
    const found = existingMap.get(key);
    return {
      page_key: key,
      seo_title: found?.seo_title ?? "",
      seo_description: found?.seo_description ?? "",
      og_image_url: found?.og_image_url ?? "",
    };
  });

  // Calculate catalog SEO audit metrics
  const products = productsRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  const missingProductSeo = products
    .filter((p) => p.is_active && (!p.seo_title || !p.seo_description))
    .map((p) => ({
      id: p.id,
      title: p.title,
      missingTitle: !p.seo_title,
      missingDesc: !p.seo_description,
    }));

  const missingCategorySeo = categories
    .filter((c) => c.is_active && (!c.seo_title || !c.seo_description))
    .map((c) => ({
      id: c.id,
      name: c.name,
      missingTitle: !c.seo_title,
      missingDesc: !c.seo_description,
    }));

  const productsWithoutImages = products
    .filter((p) => p.is_active && (!p.images || p.images.length === 0))
    .map((p) => ({ id: p.id, title: p.title }));

  const productsWithoutCategory = products
    .filter((p) => p.is_active && !p.category_id)
    .map((p) => ({ id: p.id, title: p.title }));

  const settingsRows = settingsRes.data ?? [];
  const googleTokenPresent = settingsRows.some((s) => s.key === "google_site_verification" && Boolean(s.value));
  const bingTokenPresent = settingsRows.some((s) => s.key === "bing_site_verification" && Boolean(s.value));

  const audit: SeoAuditData = {
    missingProductSeo,
    missingCategorySeo,
    productsWithoutImages,
    productsWithoutCategory,
    siteUrl,
    googleTokenPresent,
    bingTokenPresent,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-slate-900">
          SEO Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure page titles, descriptions, and share cards, and inspect catalog indexing health.
        </p>
      </div>

      <SeoManager initialPages={initialPages} audit={audit} />
    </div>
  );
}
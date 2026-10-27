import { requireAdmin } from "@/lib/auth/require-admin";
import { BlogManager, type BlogPostRecord } from "./blog-manager";

export const dynamic = "force-dynamic";

export default async function BlogDashboardPage() {
  const { supabase } = await requireAdmin();

  const [postsRes, categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("jf_blog_posts")
      .select("id,title,slug,excerpt,content,cover_image_url,status,show_on_page,faq,seo_title,seo_description,published_at,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("jf_categories").select("name,slug").eq("is_active", true).order("name"),
    supabase.from("jf_products").select("title,slug").eq("is_active", true).order("title"),
  ]);

  const rawPosts = postsRes.data ?? [];
  const initialPosts: BlogPostRecord[] = rawPosts.map((p) => ({
    ...p,
    faq: Array.isArray(p.faq) ? p.faq : [],
    show_on_page: p.show_on_page || "journal",
  }));

  const activeCategories = categoriesRes.data ?? [];
  const activeProducts = productsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-slate-900">
          Journal & Blog Articles
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish fragrance stories, styling guides, and Answer Engine Optimization (AEO) FAQs.
        </p>
      </div>

      <BlogManager
        initialPosts={initialPosts}
        activeCategories={activeCategories}
        activeProducts={activeProducts}
      />
    </div>
  );
}
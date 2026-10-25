import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function DashboardOverviewPage() {
  await connection();
  const { supabase } = await requireAdmin();
  const [categories, products, activeProducts, draftPosts, publishedPosts] = await Promise.all([
    supabase.from("jf_categories").select("id", { count: "exact", head: true }),
    supabase.from("jf_products").select("id", { count: "exact", head: true }),
    supabase.from("jf_products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("jf_blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("jf_blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  if ([categories, products, activeProducts, draftPosts, publishedPosts].some((result) => result.error)) {
    throw new Error("Unable to load dashboard counts.");
  }

  const draftCount = draftPosts.count ?? 0;
  const publishedCount = publishedPosts.count ?? 0;
  const stats = [
    { label: "Categories", value: categories.count ?? 0 },
    { label: "Products", value: products.count ?? 0 },
    { label: "Active products", value: activeProducts.count ?? 0 },
    { label: "Blog posts", value: draftCount + publishedCount, detail: `Draft: ${draftCount} · Published: ${publishedCount}` },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">Store content at a glance.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail }) => (
          <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
            <h2 className="text-sm font-medium text-slate-600">{label}</h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950">{value}</p>
            {detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
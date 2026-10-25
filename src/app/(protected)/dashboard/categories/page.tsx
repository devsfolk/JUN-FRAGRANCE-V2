import { connection } from "next/server";
import { CategoryManager } from "./category-manager";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function CategoriesPage() {
  await connection();
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("jf_categories").select("id,name,slug,description,image_url,sort_order,is_active,seo_title,seo_description,jf_products(count)").order("sort_order", { ascending: true });
  if (error) throw new Error("Unable to load categories.");
  const categories = (data ?? []).map((row) => ({
    id: row.id, name: row.name, slug: row.slug, description: row.description, image_url: row.image_url,
    sort_order: row.sort_order, is_active: row.is_active, seo_title: row.seo_title, seo_description: row.seo_description,
    product_count: Array.isArray(row.jf_products) ? row.jf_products[0]?.count ?? 0 : 0,
  }));
  return <section className="mx-auto w-full max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold text-slate-950">Categories</h1><p className="mt-1 text-sm text-slate-600">Manage product groupings and category details.</p></div><CategoryManager categories={categories} /></section>;
}
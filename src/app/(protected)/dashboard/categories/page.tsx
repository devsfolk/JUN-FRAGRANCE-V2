import { connection } from "next/server";
import { CategoryManager } from "./category-manager";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function CategoriesPage() {
  await connection();
  const { supabase } = await requireAdmin();
  const [{ data: rows, error }, { data: productRows, error: productError }] = await Promise.all([
    supabase.from("jf_categories").select("id,name,slug,image_url,is_active").order("sort_order", { ascending: true }),
    supabase.from("jf_products").select("category_id"),
  ]);
  if (error || productError) throw new Error("Unable to load categories.");
  const productCounts = new Map<string, number>();
  for (const product of productRows ?? []) {
    if (product.category_id) productCounts.set(product.category_id, (productCounts.get(product.category_id) ?? 0) + 1);
  }
  const categories = (rows ?? []).map((row) => ({ ...row, product_count: productCounts.get(row.id) ?? 0 }));
  return <section className="mx-auto w-full max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold text-slate-950">Categories</h1><p className="mt-1 text-sm text-slate-600">Manage product groupings and category details.</p></div><CategoryManager categories={categories} /></section>;
}
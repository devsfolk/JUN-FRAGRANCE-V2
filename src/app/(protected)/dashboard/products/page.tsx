import { connection } from "next/server";
import { ProductManager } from "./product-manager";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProductsPage() {
  await connection();
  const { supabase } = await requireAdmin();
  const [{ data: rows, error }, { data: categoryRows, error: categoryError }] = await Promise.all([
    supabase.from("jf_products").select("id,title,slug,category_id,price,images,is_featured,is_active,jf_categories(name)").order("sort_order", { ascending: true }),
    supabase.from("jf_categories").select("id,name").order("sort_order", { ascending: true }),
  ]);
  if (error || categoryError) throw new Error("Unable to load products.");
  const products = (rows ?? []).map((row) => ({ id: row.id, title: row.title, slug: row.slug, category_id: row.category_id, price: Number(row.price), images: row.images, is_featured: row.is_featured, is_active: row.is_active, category_name: Array.isArray(row.jf_categories) ? row.jf_categories[0]?.name ?? "" : "" }));
  return <section className="mx-auto w-full max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold text-slate-950">Products</h1><p className="mt-1 text-sm text-slate-600">Manage catalog details, pricing, and product images.</p></div><ProductManager categories={categoryRows ?? []} products={products} /></section>;
}
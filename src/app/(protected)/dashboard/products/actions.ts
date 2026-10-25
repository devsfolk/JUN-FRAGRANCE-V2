"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  category_id: z.string().uuid().nullable(),
  short_description: z.string().max(500),
  description: z.string().max(10000),
  inspired_by: z.string().max(500),
  size_ml: z.number().int().min(1).max(10000),
  price: z.number().min(0).max(100000000),
  compare_at_price: z.number().min(0).max(100000000).nullable(),
  gender: z.enum(["men", "women", "unisex"]).nullable(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  notes_top: z.array(z.string().trim().min(1).max(80)).max(30),
  notes_heart: z.array(z.string().trim().min(1).max(80)).max(30),
  notes_base: z.array(z.string().trim().min(1).max(80)).max(30),
  images: z.array(z.string().url()).max(20),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(-100000).max(100000),
  seo_title: z.string().max(120),
  seo_description: z.string().max(300),
}).refine((item) => item.compare_at_price === null || item.compare_at_price > item.price, { message: "Compare-at price must be higher than price.", path: ["compare_at_price"] });
const idSchema = z.string().uuid();

export async function saveProduct(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the product fields." };
  const { id, ...form } = parsed.data;
  const row = {
    ...form,
    category_id: form.category_id || null,
    short_description: form.short_description || null,
    description: form.description || null,
    inspired_by: form.inspired_by || null,
    gender: form.gender || null,
    accent_color: form.accent_color || null,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
  };
  const result = id ? await supabase.from("jf_products").update(row).eq("id", id) : await supabase.from("jf_products").insert(row);
  if (result.error) return { ok: false, message: result.error.code === "23505" ? "That slug is already in use." : result.error.message };
  revalidatePath("/dashboard/products"); revalidatePath("/dashboard");
  return { ok: true, message: id ? "Product updated." : "Product created." };
}

function storagePath(url: string) {
  try {
    const parsed = new URL(url);
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base || parsed.origin !== new URL(base).origin) return null;
    const marker = "/storage/v1/object/public/jf-media/";
    if (!parsed.pathname.includes(marker)) return null;
    const path = decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
    return path.startsWith("products/") && !path.split("/").some((part) => part === "..") ? path : null;
  } catch { return null; }
}

export async function deleteProduct(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product." };
  const { data: product, error: readError } = await supabase.from("jf_products").select("images").eq("id", parsed.data).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  const { data: deleted, error } = await supabase.from("jf_products").delete().eq("id", parsed.data).select("id");
  if (error) return { ok: false, message: error.message };
  if (!deleted || deleted.length !== 1) return { ok: false, message: "Product was not deleted." };

  const paths: (string | null)[] = (product?.images ?? []).map((url: string) => storagePath(url));
  let cleanupIncomplete = paths.some((path: string | null) => !path);
  const files = [...new Set(paths.filter((path: string | null): path is string => Boolean(path)))];
  if (files.length) {
    try {
      const { error: storageError } = await supabase.storage.from("jf-media").remove(files);
      if (storageError) cleanupIncomplete = true;
    } catch {
      cleanupIncomplete = true;
    }
  }
  revalidatePath("/dashboard/products"); revalidatePath("/dashboard");
  return { ok: true, message: cleanupIncomplete ? "Product deleted. Image cleanup may be incomplete." : "Product and its images deleted." };
}
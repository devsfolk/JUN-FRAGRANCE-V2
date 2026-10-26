"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { pingIndexNow } from "@/lib/site/indexnow";

function isProjectMediaUrl(value: string, folder: "categories" | "products") {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = `/storage/v1/object/public/jf-media/${folder}/`;
    return url.origin === expectedOrigin && path.startsWith(prefix) && path.slice(prefix.length).length > 0 && !path.split("/").some((part) => part === "..");
  } catch {
    return false;
  }
}

const productImageSchema = z.string().url().refine(
  (value) => isProjectMediaUrl(value, "products"),
  "Images must be public jf-media URLs in this project's products folder.",
);
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
  images: z.array(productImageSchema).max(20),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(-100000).max(100000),
  seo_title: z.string().max(120),
  seo_description: z.string().max(300),
}).refine((item) => item.compare_at_price === null || item.compare_at_price > item.price, { message: "Compare-at price must be higher than price.", path: ["compare_at_price"] });
const idSchema = z.string().uuid();

function storagePath(url: string, folder: "categories" | "products") {
  if (!isProjectMediaUrl(url, folder)) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch { return null; }
}

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
  let oldImages: string[] = [];
  if (id) {
    const { data: existing, error } = await supabase.from("jf_products").select("images").eq("id", id).maybeSingle();
    if (error) return { ok: false, message: error.message };
    oldImages = existing?.images ?? [];
  }
  const result = id ? await supabase.from("jf_products").update(row).eq("id", id) : await supabase.from("jf_products").insert(row);
  if (result.error) return { ok: false, message: result.error.code === "23505" ? "That slug is already in use." : result.error.message };

  const removedImages = oldImages.filter((url) => !form.images.includes(url));
  const paths = removedImages.map((url) => storagePath(url, "products")).filter((path): path is string => Boolean(path));
  let cleanupFailed = false;
  if (paths.length) {
    try {
      const { error } = await supabase.storage.from("jf-media").remove([...new Set(paths)]);
      if (error) cleanupFailed = true;
    } catch { cleanupFailed = true; }
  }
  revalidatePath("/dashboard/products"); revalidatePath("/dashboard");
  if (row.is_active) {
    void pingIndexNow([`/shop/${row.slug}`, "/shop"]);
  }
  const message = cleanupFailed ? "Product saved. Old image cleanup may be incomplete." : id ? "Product updated." : "Product created.";
  return { ok: true, message };
}

function productStoragePath(url: string) {
  return storagePath(url, "products");
}

export async function getProductForEdit(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product." };
  const { data, error } = await supabase.from("jf_products").select("id,title,slug,category_id,short_description,description,inspired_by,size_ml,price,compare_at_price,gender,accent_color,notes_top,notes_heart,notes_base,images,is_featured,is_active,sort_order,seo_title,seo_description").eq("id", parsed.data).maybeSingle();
  if (error || !data) return { ok: false, message: error?.message ?? "Product not found." };
  return { ok: true, product: data };
}
export async function deleteProduct(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product." };
  const { data: product, error: readError } = await supabase.from("jf_products").select("images,slug,is_active").eq("id", parsed.data).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  const { data: deleted, error } = await supabase.from("jf_products").delete().eq("id", parsed.data).select("id");
  if (error) return { ok: false, message: error.message };
  if (!deleted || deleted.length !== 1) return { ok: false, message: "Product was not deleted." };

  const paths: (string | null)[] = (product?.images ?? []).map((url: string) => productStoragePath(url));
  let cleanupIncomplete = paths.some((path) => !path);
  const files = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (files.length) {
    try {
      const { error: storageError } = await supabase.storage.from("jf-media").remove(files);
      if (storageError) cleanupIncomplete = true;
    } catch {
      cleanupIncomplete = true;
    }
  }
  revalidatePath("/dashboard/products"); revalidatePath("/dashboard");
  if (product?.is_active && product.slug) {
    void pingIndexNow([`/shop/${product.slug}`, "/shop"]);
  }
  return { ok: true, message: cleanupIncomplete ? "Product deleted. Image cleanup may be incomplete." : "Product and its images deleted." };
}
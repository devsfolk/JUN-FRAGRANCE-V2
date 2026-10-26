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

const categoryImageSchema = z.string().url().refine(
  (value) => isProjectMediaUrl(value, "categories"),
  "Image must be a public jf-media URL in this project's categories folder.",
);
const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().max(5000),
  image_url: z.union([categoryImageSchema, z.literal("")]),
  sort_order: z.number().int().min(-100000).max(100000),
  is_active: z.boolean(),
  seo_title: z.string().max(120),
  seo_description: z.string().max(300),
});
const idSchema = z.string().uuid();

function storagePath(url: string, folder: "categories" | "products") {
  if (!isProjectMediaUrl(url, folder)) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch { return null; }
}

export async function saveCategory(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the category fields." };
  const { id, ...form } = parsed.data;
  const row = {
    ...form,
    image_url: form.image_url || null,
    description: form.description || null,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
  };
  let oldImage: string | null = null;
  if (id) {
    const { data: existing, error } = await supabase.from("jf_categories").select("image_url").eq("id", id).maybeSingle();
    if (error) return { ok: false, message: error.message };
    oldImage = existing?.image_url ?? null;
  }
  const result = id
    ? await supabase.from("jf_categories").update(row).eq("id", id)
    : await supabase.from("jf_categories").insert(row);
  if (result.error) return { ok: false, message: result.error.code === "23505" ? "That slug is already in use." : result.error.message };
  let cleanupFailed = false;
  if (oldImage && oldImage !== row.image_url) {
    const path = storagePath(oldImage, "categories");
    if (path) {
      try {
        const { error } = await supabase.storage.from("jf-media").remove([path]);
        if (error) cleanupFailed = true;
      } catch { cleanupFailed = true; }
    }
  }
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  if (row.is_active) {
    void pingIndexNow([`/category/${row.slug}`, "/shop"]);
  }
  const message = cleanupFailed ? "Category saved. Old image cleanup may be incomplete." : id ? "Category updated." : "Category created.";
  return { ok: true, message };
}

export async function getCategoryForEdit(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid category." };
  const { data, error } = await supabase.from("jf_categories").select("id,name,slug,description,image_url,sort_order,is_active,seo_title,seo_description").eq("id", parsed.data).maybeSingle();
  if (error || !data) return { ok: false, message: error?.message ?? "Category not found." };
  return { ok: true, category: data };
}
export async function deleteCategory(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid category." };
  const { count, error: countError } = await supabase.from("jf_products").select("id", { count: "exact", head: true }).eq("category_id", parsed.data);
  if (countError) return { ok: false, message: countError.message };
  if ((count ?? 0) > 0) return { ok: false, message: "This category still has products. Move or delete them before deleting the category." };
  const { data: category, error: readError } = await supabase.from("jf_categories").select("image_url,slug,is_active").eq("id", parsed.data).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  const { data: deleted, error } = await supabase.from("jf_categories").delete().eq("id", parsed.data).select("id");
  if (error) return { ok: false, message: error.message };
  if (!deleted || deleted.length !== 1) return { ok: false, message: "Category was not deleted." };

  let cleanupIncomplete = false;
  const path = category?.image_url ? storagePath(category.image_url, "categories") : null;
  if (category?.image_url && !path) cleanupIncomplete = true;
  if (path) {
    try {
      const { error: storageError } = await supabase.storage.from("jf-media").remove([path]);
      if (storageError) cleanupIncomplete = true;
    } catch {
      cleanupIncomplete = true;
    }
  }
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  if (category?.is_active && category.slug) {
    void pingIndexNow([`/category/${category.slug}`, "/shop"]);
  }
  return { ok: true, message: cleanupIncomplete ? "Category deleted. Image cleanup may be incomplete." : "Category deleted." };
}
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().max(5000),
  image_url: z.union([z.string().url(), z.literal("")]),
  sort_order: z.number().int().min(-100000).max(100000),
  is_active: z.boolean(),
  seo_title: z.string().max(120),
  seo_description: z.string().max(300),
});
const idSchema = z.string().uuid();

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
  const result = id
    ? await supabase.from("jf_categories").update(row).eq("id", id)
    : await supabase.from("jf_categories").insert(row);
  if (result.error) return { ok: false, message: result.error.code === "23505" ? "That slug is already in use." : result.error.message };
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { ok: true, message: id ? "Category updated." : "Category created." };
}

export async function deleteCategory(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid category." };
  const { count, error: countError } = await supabase.from("jf_products").select("id", { count: "exact", head: true }).eq("category_id", parsed.data);
  if (countError) return { ok: false, message: countError.message };
  if ((count ?? 0) > 0) return { ok: false, message: "This category still has products. Move or delete them before deleting the category." };
  const { error } = await supabase.from("jf_categories").delete().eq("id", parsed.data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { ok: true, message: "Category deleted." };
}
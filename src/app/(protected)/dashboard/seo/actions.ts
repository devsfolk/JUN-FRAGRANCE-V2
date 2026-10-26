"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

function isProjectSeoMediaUrl(value: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = "/storage/v1/object/public/jf-media/seo/";
    return (
      url.origin === expectedOrigin &&
      path.startsWith(prefix) &&
      path.slice(prefix.length).length > 0 &&
      !path.split("/").some((part) => part === "..")
    );
  } catch {
    return false;
  }
}

const pageKeys = ["home", "shop", "about", "contact", "journal", "faq"] as const;

const pageSeoItemSchema = z.object({
  page_key: z.enum(pageKeys),
  seo_title: z.string().trim().max(120),
  seo_description: z.string().trim().max(300),
  og_image_url: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || isProjectSeoMediaUrl(val) || val.startsWith("https://"),
      "Must be an image in the jf-media seo folder or a valid https URL."
    ),
});

const saveAllPagesSeoSchema = z.array(pageSeoItemSchema);

export async function savePageSEO(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = saveAllPagesSeoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid page SEO input." };
  }

  const items = parsed.data;

  const rowsToUpsert = items.map((item) => ({
    page_key: item.page_key,
    seo_title: item.seo_title.length > 0 ? item.seo_title : null,
    seo_description: item.seo_description.length > 0 ? item.seo_description : null,
    og_image_url: item.og_image_url.length > 0 ? item.og_image_url : null,
  }));

  const { error } = await supabase
    .from("jf_pages_seo")
    .upsert(rowsToUpsert, { onConflict: "page_key" });

  if (error) {
    return { ok: false, error: error.message || "Failed to save pages SEO." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

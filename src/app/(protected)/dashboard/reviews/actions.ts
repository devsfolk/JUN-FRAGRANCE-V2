"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  author_name: z.string().trim().min(1, "Author name is required.").max(40, "Author name must be 40 characters or fewer."),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(400, "Review text must be 400 characters or fewer."),
  is_approved: z.boolean(),
  has_real_review: z.boolean().refine((value) => value, "Confirm that you have the customer's message or screenshot."),
});

const idSchema = z.string().uuid();

async function productSlugForReview(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], productId: string) {
  const { data, error } = await supabase.from("jf_products").select("slug").eq("id", productId).maybeSingle();
  if (error) return { slug: null, error: error.message };
  return { slug: data?.slug ?? null, error: null };
}

function revalidateReviewViews(slugs: Array<string | null>) {
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/shop/${slug}`);
  }
  revalidateTag("approved-reviews", "max");
  revalidatePath("/");
  revalidatePath("/", "layout");
}

export async function saveReview(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the review fields." };

  const { id, ...form } = parsed.data;
  let previousProductId: string | null = null;
  if (id) {
    const { data: existing, error } = await supabase.from("jf_reviews").select("product_id").eq("id", id).maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!existing) return { ok: false, message: "Review not found." };
    previousProductId = existing.product_id;
  }

  const affectedProductIds = [...new Set([previousProductId, form.product_id].filter((value): value is string => Boolean(value)))];
  const productResults = await Promise.all(affectedProductIds.map((productId) => productSlugForReview(supabase, productId)));
  const productError = productResults.find((result) => result.error)?.error;
  if (productError) return { ok: false, message: productError };
  if (productResults.some((result) => !result.slug)) return { ok: false, message: "Choose an existing product." };

  const row = {
    product_id: form.product_id,
    author_name: form.author_name,
    rating: form.rating,
    body: form.body || null,
    is_approved: form.is_approved,
  };
  const result = id
    ? await supabase.from("jf_reviews").update(row).eq("id", id).select("id").maybeSingle()
    : await supabase.from("jf_reviews").insert(row).select("id").single();
  if (result.error) return { ok: false, message: result.error.message };
  if (!result.data) return { ok: false, message: "Review was not saved." };

  revalidateReviewViews(productResults.map((product) => product.slug));
  return { ok: true, message: id ? "Review updated." : "Review added." };
}

export async function deleteReview(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid review." };

  const { data: existing, error: readError } = await supabase.from("jf_reviews").select("product_id").eq("id", parsed.data).maybeSingle();
  if (readError) return { ok: false, message: readError.message };
  if (!existing) return { ok: false, message: "Review not found." };
  const { slug, error: productError } = await productSlugForReview(supabase, existing.product_id);
  if (productError) return { ok: false, message: productError };

  const { data: deleted, error } = await supabase.from("jf_reviews").delete().eq("id", parsed.data).select("id").maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!deleted) return { ok: false, message: "Review was not deleted." };

  revalidateReviewViews([slug]);
  return { ok: true, message: "Review deleted." };
}

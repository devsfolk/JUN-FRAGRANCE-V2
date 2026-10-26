"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { pingIndexNow } from "@/lib/site/indexnow";

function isProjectMediaUrl(value: string, folder: "blog") {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = `/storage/v1/object/public/jf-media/${folder}/`;
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

function blogStoragePath(url: string) {
  if (!isProjectMediaUrl(url, "blog")) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch {
    return null;
  }
}

const faqItemSchema = z.object({
  question: z.string().trim().min(1, "Question cannot be empty.").max(300),
  answer: z.string().trim().min(1, "Answer cannot be empty.").max(5000),
});

const blogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  excerpt: z.string().trim().max(1000).nullable(),
  content: z.string().max(100000).nullable(),
  cover_image_url: z
    .string()
    .trim()
    .refine((val) => val === "" || isProjectMediaUrl(val, "blog"), "Must be a jf-media blog URL")
    .nullable(),
  status: z.enum(["draft", "published"]),
  show_on_page: z.string().trim().max(120),
  faq: z.array(faqItemSchema).max(50),
  seo_title: z.string().trim().max(120).nullable(),
  seo_description: z.string().trim().max(300).nullable(),
});

const idSchema = z.string().uuid();

export async function saveBlogPost(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the post fields." };
  }

  const { id, ...data } = parsed.data;

  // Read existing post to check cover_image and published_at
  let oldCover: string | null = null;
  let existingPublishedAt: string | null = null;

  if (id) {
    const { data: existing, error } = await supabase
      .from("jf_blog_posts")
      .select("cover_image_url,published_at,status")
      .eq("id", id)
      .maybeSingle();

    if (error) return { ok: false, message: error.message };
    oldCover = existing?.cover_image_url ?? null;
    existingPublishedAt = existing?.published_at ?? null;
  }

  // Set published_at automatically on first publish
  let published_at = existingPublishedAt;
  if (data.status === "published" && !published_at) {
    published_at = new Date().toISOString();
  }

  const row = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    content: data.content || null,
    cover_image_url: data.cover_image_url || null,
    status: data.status,
    show_on_page: data.show_on_page || "journal",
    faq: data.faq,
    seo_title: data.seo_title || null,
    seo_description: data.seo_description || null,
    published_at,
  };

  const result = id
    ? await supabase.from("jf_blog_posts").update(row).eq("id", id)
    : await supabase.from("jf_blog_posts").insert(row);

  if (result.error) {
    return {
      ok: false,
      message: result.error.code === "23505" ? "That slug is already in use." : result.error.message,
    };
  }

  // Clean up old cover image if replaced
  let cleanupFailed = false;
  if (oldCover && oldCover !== row.cover_image_url) {
    const path = blogStoragePath(oldCover);
    if (path) {
      try {
        const { error: storageError } = await supabase.storage.from("jf-media").remove([path]);
        if (storageError) cleanupFailed = true;
      } catch {
        cleanupFailed = true;
      }
    }
  }

  revalidatePath("/dashboard/blog");
  revalidatePath("/journal");
  revalidatePath(`/journal/${row.slug}`);
  revalidatePath("/", "layout");

  // Trigger IndexNow if post is published
  if (row.status === "published") {
    void pingIndexNow([`/journal/${row.slug}`, "/journal"]);
  }

  const message = cleanupFailed
    ? "Post saved. Old image cleanup may be incomplete."
    : id
    ? "Post updated."
    : "Post created.";

  return { ok: true, message };
}

export async function deleteBlogPost(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid post ID." };

  const { data: post, error: readError } = await supabase
    .from("jf_blog_posts")
    .select("cover_image_url,slug,status")
    .eq("id", parsed.data)
    .maybeSingle();

  if (readError) return { ok: false, message: readError.message };

  const { data: deleted, error } = await supabase
    .from("jf_blog_posts")
    .delete()
    .eq("id", parsed.data)
    .select("id");

  if (error) return { ok: false, message: error.message };
  if (!deleted || deleted.length !== 1) return { ok: false, message: "Post was not deleted." };

  // Remove cover image from storage safely
  let cleanupIncomplete = false;
  const path = post?.cover_image_url ? blogStoragePath(post.cover_image_url) : null;
  if (path) {
    try {
      const { error: storageError } = await supabase.storage.from("jf-media").remove([path]);
      if (storageError) cleanupIncomplete = true;
    } catch {
      cleanupIncomplete = true;
    }
  }

  revalidatePath("/dashboard/blog");
  revalidatePath("/journal");
  revalidatePath("/", "layout");

  if (post?.status === "published" && post.slug) {
    void pingIndexNow([`/journal/${post.slug}`, "/journal"]);
  }

  return {
    ok: true,
    message: cleanupIncomplete ? "Post deleted. Image cleanup may be incomplete." : "Post and cover image deleted.",
  };
}

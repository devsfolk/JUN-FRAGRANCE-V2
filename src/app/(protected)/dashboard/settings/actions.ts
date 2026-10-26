"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

function isProjectHeroMediaUrl(value: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = "/storage/v1/object/public/jf-media/hero/";
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

function heroStoragePath(url: string) {
  if (!isProjectHeroMediaUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch {
    return null;
  }
}

const heroSceneItemSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (val) => isProjectHeroMediaUrl(val),
      "Hero image must be a public URL in this project's jf-media bucket under hero/."
    ),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color like #C9A66B"),
  alt: z.string().trim().max(200),
});

const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^\d{10,15}$/.test(val),
      "Must be 10 to 15 digits with country code first (e.g. 923001234567, no plus or spaces)."
    ),
  social_instagram: z.string().trim().refine((val) => val === "" || val.startsWith("https://"), "Must be a valid https URL"),
  social_tiktok: z.string().trim().refine((val) => val === "" || val.startsWith("https://"), "Must be a valid https URL"),
  social_facebook: z.string().trim().refine((val) => val === "" || val.startsWith("https://"), "Must be a valid https URL"),
  social_youtube: z.string().trim().refine((val) => val === "" || val.startsWith("https://"), "Must be a valid https URL"),
  google_site_verification: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[a-zA-Z0-9_-]{1,120}$/.test(val),
      "Token only (letters, digits, dash, underscore, max 120 chars)."
    ),
  bing_site_verification: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[a-zA-Z0-9_-]{1,120}$/.test(val),
      "Token only (letters, digits, dash, underscore, max 120 chars)."
    ),
  business_city: z.string().trim().max(100),
  business_address: z.string().trim().max(300),
  business_phone_display: z.string().trim().max(50),
  hero_scenes: z.array(heroSceneItemSchema).max(4),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export async function saveSettings(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid settings input." };
  }

  const data = parsed.data;

  // Retrieve existing hero_scenes to detect removed files for safe deletion
  const { data: existingHeroRow } = await supabase
    .from("jf_settings")
    .select("value")
    .eq("key", "hero_scenes")
    .maybeSingle();

  let existingHeroUrls: string[] = [];
  if (existingHeroRow?.value) {
    try {
      const decoded =
        typeof existingHeroRow.value === "string"
          ? JSON.parse(existingHeroRow.value)
          : existingHeroRow.value;
      if (Array.isArray(decoded)) {
        existingHeroUrls = decoded.map((item) => item?.url).filter(Boolean);
      }
    } catch {
      existingHeroUrls = [];
    }
  }

  // Build upsert items and delete items
  const keysToUpsert: Array<{ key: string; value: unknown }> = [];
  const keysToDelete: string[] = [];

  const textFields = [
    "whatsapp_number",
    "social_instagram",
    "social_tiktok",
    "social_facebook",
    "social_youtube",
    "google_site_verification",
    "bing_site_verification",
    "business_city",
    "business_address",
    "business_phone_display",
  ] as const;

  for (const field of textFields) {
    const val = data[field];
    if (val && val.trim().length > 0) {
      keysToUpsert.push({ key: field, value: val.trim() });
    } else {
      keysToDelete.push(field);
    }
  }

  // Hero scenes array: if empty, delete setting key; otherwise upsert as JSON array
  if (data.hero_scenes.length > 0) {
    keysToUpsert.push({ key: "hero_scenes", value: data.hero_scenes });
  } else {
    keysToDelete.push("hero_scenes");
  }

  // Execute Upserts
  if (keysToUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from("jf_settings")
      .upsert(keysToUpsert, { onConflict: "key" });
    if (upsertErr) {
      return { ok: false, error: upsertErr.message || "Failed to save settings." };
    }
  }

  // Execute Deletes
  if (keysToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from("jf_settings")
      .delete()
      .in("key", keysToDelete);
    if (delErr) {
      return { ok: false, error: delErr.message || "Failed to remove unused settings." };
    }
  }

  // Clean up removed hero images from storage safely
  const currentHeroUrls = new Set(data.hero_scenes.map((s) => s.url));
  const removedHeroPaths = existingHeroUrls
    .filter((url) => !currentHeroUrls.has(url))
    .map((url) => heroStoragePath(url))
    .filter((p): p is string => Boolean(p));

  if (removedHeroPaths.length > 0) {
    await supabase.storage.from("jf-media").remove(removedHeroPaths);
  }

  // Revalidate layout so public site updates immediately
  revalidatePath("/", "layout");

  return { ok: true };
}

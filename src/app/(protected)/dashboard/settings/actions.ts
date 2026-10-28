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

function isProjectLogoMediaUrl(value: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = "/storage/v1/object/public/jf-media/logo/";
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

function logoStoragePath(url: string) {
  if (!isProjectLogoMediaUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch {
    return null;
  }
}

function isProjectFaviconMediaUrl(value: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = "/storage/v1/object/public/jf-media/favicon/";
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

function faviconStoragePath(url: string) {
  if (!isProjectFaviconMediaUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/jf-media/";
    return decodeURIComponent(parsed.pathname.split(marker)[1] ?? "");
  } catch {
    return null;
  }
}

function isProjectBundleMediaUrl(value: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return false;
    const url = new URL(value);
    const expectedOrigin = new URL(base).origin;
    const path = decodeURIComponent(url.pathname);
    const prefix = "/storage/v1/object/public/jf-media/bundle/";
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

function bundleStoragePath(url: string) {
  if (!isProjectBundleMediaUrl(url)) return null;
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

const siteLogoSchema = z
  .object({
    url: z
      .string()
      .url()
      .refine(
        (val) => isProjectLogoMediaUrl(val),
        "Logo must be a public URL in this project's jf-media bucket under logo/."
      ),
    alt: z.string().trim().max(120),
  })
  .nullable();

const siteFaviconSchema = z
  .object({
    url: z
      .string()
      .url()
      .refine(
        (val) => isProjectFaviconMediaUrl(val),
        "Favicon must be a public URL in this project's jf-media bucket under favicon/."
      ),
  })
  .nullable();

const bundleImageSchema = z
  .object({
    url: z
      .string()
      .url()
      .refine(
        (val) => isProjectBundleMediaUrl(val),
        "Bundle image must be a public URL in this project's jf-media bucket under bundle/."
      ),
  })
  .nullable();

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
  site_logo: siteLogoSchema.optional().nullable(),
  site_favicon: siteFaviconSchema.optional().nullable(),
  logo_show_text: z.boolean().default(false),
  bundle_enabled: z.boolean().default(true),
  bundle_price: z.coerce.number().int().min(1).max(1000000).default(4500),
  bundle_image: bundleImageSchema.optional().nullable(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export async function saveSettings(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid settings input." };
  }

  const data = parsed.data;

  // Retrieve existing hero_scenes, site_logo, site_favicon, and bundle_image to detect removed files for safe deletion
  const [heroRowRes, logoRowRes, faviconRowRes, bundleRowRes] = await Promise.all([
    supabase
      .from("jf_settings")
      .select("value")
      .eq("key", "hero_scenes")
      .maybeSingle(),
    supabase
      .from("jf_settings")
      .select("value")
      .eq("key", "site_logo")
      .maybeSingle(),
    supabase
      .from("jf_settings")
      .select("value")
      .eq("key", "site_favicon")
      .maybeSingle(),
    supabase
      .from("jf_settings")
      .select("value")
      .eq("key", "bundle_image")
      .maybeSingle(),
  ]);

  const existingHeroRow = heroRowRes.data;
  const existingLogoRow = logoRowRes.data;
  const existingFaviconRow = faviconRowRes.data;
  const existingBundleRow = bundleRowRes.data;

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

  let existingLogoUrl: string | null = null;
  if (existingLogoRow?.value) {
    try {
      const decoded =
        typeof existingLogoRow.value === "string"
          ? JSON.parse(existingLogoRow.value)
          : existingLogoRow.value;
      if (decoded && typeof decoded === "object" && typeof decoded.url === "string") {
        existingLogoUrl = decoded.url;
      }
    } catch {
      existingLogoUrl = null;
    }
  }

  let existingFaviconUrl: string | null = null;
  if (existingFaviconRow?.value) {
    try {
      const decoded =
        typeof existingFaviconRow.value === "string"
          ? JSON.parse(existingFaviconRow.value)
          : existingFaviconRow.value;
      if (decoded && typeof decoded === "object" && typeof decoded.url === "string") {
        existingFaviconUrl = decoded.url;
      }
    } catch {
      existingFaviconUrl = null;
    }
  }

  let existingBundleUrl: string | null = null;
  if (existingBundleRow?.value) {
    try {
      const decoded =
        typeof existingBundleRow.value === "string"
          ? JSON.parse(existingBundleRow.value)
          : existingBundleRow.value;
      if (decoded && typeof decoded === "object" && typeof decoded.url === "string") {
        existingBundleUrl = decoded.url;
      }
    } catch {
      existingBundleUrl = null;
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

  // Site logo: if present and has url, upsert as JSON object; otherwise delete setting key
  if (data.site_logo && data.site_logo.url) {
    keysToUpsert.push({
      key: "site_logo",
      value: {
        url: data.site_logo.url,
        alt: data.site_logo.alt.trim() || "Jun.fragrance",
      },
    });
  } else {
    keysToDelete.push("site_logo");
  }

  // Site favicon: if present and has url, upsert as JSON object; otherwise delete setting key
  if (data.site_favicon && data.site_favicon.url) {
    keysToUpsert.push({
      key: "site_favicon",
      value: {
        url: data.site_favicon.url,
      },
    });
  } else {
    keysToDelete.push("site_favicon");
  }

  // Logo show text switch
  keysToUpsert.push({
    key: "logo_show_text",
    value: String(Boolean(data.logo_show_text)),
  });

  // Bundle promotion settings
  keysToUpsert.push({
    key: "bundle_enabled",
    value: Boolean(data.bundle_enabled),
  });
  keysToUpsert.push({
    key: "bundle_price",
    value: Math.round(Number(data.bundle_price)),
  });
  if (data.bundle_image && data.bundle_image.url) {
    keysToUpsert.push({
      key: "bundle_image",
      value: {
        url: data.bundle_image.url,
      },
    });
  } else {
    keysToDelete.push("bundle_image");
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

  // Clean up removed or replaced logo from storage safely
  const currentLogoUrl = data.site_logo?.url ?? null;
  if (existingLogoUrl && existingLogoUrl !== currentLogoUrl) {
    const oldLogoPath = logoStoragePath(existingLogoUrl);
    if (oldLogoPath) {
      await supabase.storage.from("jf-media").remove([oldLogoPath]);
    }
  }

  // Clean up removed or replaced favicon from storage safely
  const currentFaviconUrl = data.site_favicon?.url ?? null;
  if (existingFaviconUrl && existingFaviconUrl !== currentFaviconUrl) {
    const oldFaviconPath = faviconStoragePath(existingFaviconUrl);
    if (oldFaviconPath) {
      await supabase.storage.from("jf-media").remove([oldFaviconPath]);
    }
  }

  // Clean up removed or replaced bundle image from storage safely
  const currentBundleUrl = data.bundle_image?.url ?? null;
  if (existingBundleUrl && existingBundleUrl !== currentBundleUrl) {
    const oldBundlePath = bundleStoragePath(existingBundleUrl);
    if (oldBundlePath) {
      await supabase.storage.from("jf-media").remove([oldBundlePath]);
    }
  }

  // Revalidate layout and /bundle so public site updates immediately
  revalidatePath("/", "layout");
  revalidatePath("/bundle");

  return { ok: true };
}

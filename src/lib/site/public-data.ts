import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const settingKeys = ["whatsapp_number", "social_instagram", "social_tiktok", "social_facebook", "social_youtube"] as const;
export type SiteSettings = Partial<Record<(typeof settingKeys)[number], string>>;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function settingText(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const decoded: unknown = JSON.parse(value);
    return typeof decoded === "string" ? decoded : value;
  } catch {
    return value;
  }
}

const loadSettings = unstable_cache(async (): Promise<SiteSettings> => {
  const supabase = publicClient();
  if (!supabase) return {};
  const { data, error } = await supabase.from("jf_settings").select("key,value").in("key", [...settingKeys]);
  if (error) return {};
  const settings: SiteSettings = {};
  for (const row of data ?? []) {
    if (settingKeys.includes(row.key as (typeof settingKeys)[number])) {
      const text = settingText(row.value);
      if (text) settings[row.key as (typeof settingKeys)[number]] = text;
    }
  }
  return settings;
}, ["jf-public-settings-v1"], { revalidate: 60, tags: ["public-settings"] });

export const getPublicSettings = () => loadSettings();

export type HomeProduct = {
  id: string;
  title: string;
  slug: string;
  inspired_by: string | null;
  accent_color: string | null;
  images: string[];
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  price: number;
  size_ml: number;
};
export type HomeCategory = { id: string; name: string; slug: string; image_url: string | null };
export type HomeReview = { id: string; author_name: string; rating: number; body: string | null };
export type HomeData = { products: HomeProduct[]; activeProducts: HomeProduct[]; categories: HomeCategory[]; reviews: HomeReview[] };

const loadHomeData = unstable_cache(async (): Promise<HomeData> => {
  const empty: HomeData = { products: [], activeProducts: [], categories: [], reviews: [] };
  const supabase = publicClient();
  if (!supabase) return empty;
  const [featuredResult, activeResult, categoriesResult, reviewsResult] = await Promise.all([
    supabase.from("jf_products").select("id,title,slug,inspired_by,accent_color,images,notes_top,notes_heart,notes_base,price,size_ml").eq("is_active", true).eq("is_featured", true).order("sort_order", { ascending: true, nullsFirst: false }),
    supabase.from("jf_products").select("id,title,slug,inspired_by,accent_color,images,notes_top,notes_heart,notes_base,price,size_ml").eq("is_active", true).order("sort_order", { ascending: true, nullsFirst: false }),
    supabase.from("jf_categories").select("id,name,slug,image_url").eq("is_active", true).order("sort_order", { ascending: true, nullsFirst: false }),
    supabase.from("jf_reviews").select("id,author_name,rating,body").eq("is_approved", true).order("created_at", { ascending: false }),
  ]);
  const products = (featuredResult.error ? [] : featuredResult.data ?? []).map((item) => ({ ...item, price: Number(item.price), images: item.images ?? [], notes_top: item.notes_top ?? [], notes_heart: item.notes_heart ?? [], notes_base: item.notes_base ?? [] }));
  const activeProducts = (activeResult.error ? [] : activeResult.data ?? []).map((item) => ({ ...item, price: Number(item.price), images: item.images ?? [], notes_top: item.notes_top ?? [], notes_heart: item.notes_heart ?? [], notes_base: item.notes_base ?? [] }));
  return { products, activeProducts, categories: categoriesResult.error ? [] : categoriesResult.data ?? [], reviews: reviewsResult.error ? [] : reviewsResult.data ?? [] };
}, ["jf-home-public-data-v1"], { revalidate: 60, tags: ["home-data"] });

export const getHomeData = () => loadHomeData();

export type HeroProductData = {
  id: string;
  title: string;
  slug: string;
  images: string[];
  inspired_by: string | null;
  accent_color: string | null;
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  price: number;
  size_ml: number;
};

const loadFeaturedHeroProducts = unstable_cache(
  async (): Promise<HeroProductData[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_products")
      .select("id,title,slug,images,inspired_by,accent_color,notes_top,notes_heart,notes_base,price,size_ml")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .limit(4);

    if (error || !data) return [];
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      images: Array.isArray(item.images) ? item.images : [],
      inspired_by: item.inspired_by,
      accent_color: item.accent_color,
      notes_top: Array.isArray(item.notes_top) ? item.notes_top : [],
      notes_heart: Array.isArray(item.notes_heart) ? item.notes_heart : [],
      notes_base: Array.isArray(item.notes_base) ? item.notes_base : [],
      price: Number(item.price) || 0,
      size_ml: Number(item.size_ml) || 50,
    }));
  },
  ["jf-hero-products-v2"],
  { revalidate: 60, tags: ["hero-products"] }
);

export const getFeaturedHeroProducts = () => loadFeaturedHeroProducts();

export type ActiveCategory = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
};

const loadActiveCategories = unstable_cache(
  async (): Promise<ActiveCategory[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_categories")
      .select("name,slug,description,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description,
      image_url: item.image_url,
      sort_order: item.sort_order,
    }));
  },
  ["jf-active-categories-v1"],
  { revalidate: 60, tags: ["active-categories"] }
);

export const getActiveCategories = () => loadActiveCategories();

export type FeaturedPickProduct = {
  id: string;
  title: string;
  slug: string;
  images: string[];
  inspired_by: string | null;
  price: number;
  compare_at_price: number | null;
  size_ml: number;
  accent_color: string | null;
};

const loadFeaturedPicks = unstable_cache(
  async (): Promise<FeaturedPickProduct[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_products")
      .select("id,title,slug,images,inspired_by,price,compare_at_price,size_ml,accent_color")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .limit(8);

    if (error || !data) return [];
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      images: Array.isArray(item.images) ? item.images : [],
      inspired_by: item.inspired_by,
      price: Number(item.price) || 0,
      compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : null,
      size_ml: Number(item.size_ml) || 50,
      accent_color: item.accent_color,
    }));
  },
  ["jf-featured-picks-v1"],
  { revalidate: 60, tags: ["featured-picks"] }
);

export const getFeaturedPicks = () => loadFeaturedPicks();

export type ApprovedReview = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
};

const loadApprovedReviews = unstable_cache(
  async (): Promise<ApprovedReview[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_reviews")
      .select("id,author_name,rating,body")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error || !data) return [];
    return data.map((item) => ({
      id: item.id,
      author_name: item.author_name,
      rating: Number(item.rating) || 5,
      body: item.body,
    }));
  },
  ["jf-approved-reviews-v1"],
  { revalidate: 60, tags: ["approved-reviews"] }
);

export const getApprovedReviews = () => loadApprovedReviews();
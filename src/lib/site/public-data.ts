import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const settingKeys = [
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
  "hero_scenes",
  "site_logo",
  "site_favicon",
  "logo_show_text",
  "bundle_enabled",
  "bundle_price",
  "bundle_image",
] as const;
export type SiteSettings = Partial<Record<(typeof settingKeys)[number], string>>;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function settingText(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    try {
      const decoded: unknown = JSON.parse(value);
      if (typeof decoded === "string") return decoded;
      return typeof decoded === "object" ? JSON.stringify(decoded) : value;
    } catch {
      return value;
    }
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
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

export type SiteLogo = {
  url: string;
  alt: string;
};

export function parseSiteLogo(val: string | undefined): SiteLogo | null {
  if (!val) return null;
  try {
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed === "object" && typeof parsed.url === "string" && parsed.url) {
      return {
        url: parsed.url,
        alt: typeof parsed.alt === "string" && parsed.alt.trim() ? parsed.alt.trim() : "Jun.fragrance",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export type SiteFavicon = {
  url: string;
};

export function parseSiteFavicon(val: string | undefined): SiteFavicon | null {
  if (!val) return null;
  try {
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed === "object" && typeof parsed.url === "string" && parsed.url) {
      return { url: parsed.url };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseLogoShowText(val: string | undefined): boolean {
  if (!val) return false;
  return val === "true" || val === "1";
}

export type BundleSettings = {
  enabled: boolean;
  price: number;
  imageUrl: string | null;
};

export function parseBundleSettings(settings: SiteSettings): BundleSettings {
  let enabled = true;
  if (settings.bundle_enabled !== undefined) {
    enabled = settings.bundle_enabled === "true" || settings.bundle_enabled === "1";
  }

  let price = 4500;
  if (settings.bundle_price) {
    const parsed = parseInt(settings.bundle_price, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000000) {
      price = parsed;
    }
  }

  let imageUrl: string | null = null;
  if (settings.bundle_image) {
    try {
      const parsed = typeof settings.bundle_image === "string" ? JSON.parse(settings.bundle_image) : settings.bundle_image;
      if (parsed && typeof parsed === "object" && typeof parsed.url === "string" && parsed.url) {
        imageUrl = parsed.url;
      }
    } catch {
      imageUrl = null;
    }
  }

  return { enabled, price, imageUrl };
}

export async function getBundleSettings(): Promise<BundleSettings> {
  const settings = await getPublicSettings();
  return parseBundleSettings(settings);
}

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

export type BundleProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  size_ml: number;
  image: string | null;
  gender: string | null;
};

const loadBundleProducts = unstable_cache(
  async (): Promise<BundleProduct[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_products")
      .select("id,title,slug,price,size_ml,images,gender,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .limit(200);

    if (error || !data) return [];
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      price: Number(item.price) || 0,
      size_ml: Number(item.size_ml) || 50,
      image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null,
      gender: item.gender ?? null,
    }));
  },
  ["jf-bundle-products-v1"],
  { revalidate: 60, tags: ["bundle-products", "products"] }
);

export const getBundleProducts = () => loadBundleProducts();
 
export type ShopProduct = {
   id: string;
   title: string;
   slug: string;
   images: string[];
   inspired_by: string | null;
   price: number;
   compare_at_price: number | null;
   size_ml: number;
   accent_color: string | null;
   category_id: string | null;
 };
 
const loadAllShopProducts = unstable_cache(
   async (): Promise<ShopProduct[]> => {
     const supabase = publicClient();
     if (!supabase) return [];
     const { data, error } = await supabase
       .from("jf_products")
       .select("id,title,slug,images,inspired_by,price,compare_at_price,size_ml,accent_color,category_id")
       .eq("is_active", true)
       .order("sort_order", { ascending: true, nullsFirst: false })
       .order("created_at", { ascending: false })
       .limit(200);
 
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
       category_id: item.category_id,
     }));
   },
   ["jf-shop-products-v1"],
   { revalidate: 60, tags: ["shop-products"] }
 );
 
export const getAllShopProducts = () => loadAllShopProducts();
 
export type CategoryWithSEO = {
   id: string;
   name: string;
   slug: string;
   description: string | null;
   image_url: string | null;
   seo_title: string | null;
   seo_description: string | null;
 };
 
export async function getCategoryBySlug(slug: string): Promise<CategoryWithSEO | null> {
   const supabase = publicClient();
   if (!supabase) return null;
   const { data, error } = await supabase
     .from("jf_categories")
     .select("id,name,slug,description,image_url,seo_title,seo_description")
     .eq("slug", slug)
     .eq("is_active", true)
     .maybeSingle();
 
   if (error || !data) return null;
   return data;
 }
 
export async function getProductsByCategory(categoryId: string): Promise<ShopProduct[]> {
   const supabase = publicClient();
   if (!supabase) return [];
   const { data, error } = await supabase
     .from("jf_products")
     .select("id,title,slug,images,inspired_by,price,compare_at_price,size_ml,accent_color,category_id")
     .eq("category_id", categoryId)
     .eq("is_active", true)
     .order("sort_order", { ascending: true, nullsFirst: false })
     .order("created_at", { ascending: false })
     .limit(200);
 
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
     category_id: item.category_id,
   }));
 }
 
export type ProductDetail = {
   id: string;
   category_id: string | null;
   category?: { name: string; slug: string } | null;
   title: string;
   slug: string;
   short_description: string | null;
   description: string | null;
   inspired_by: string | null;
   size_ml: number;
   price: number;
   compare_at_price: number | null;
   images: string[];
   notes_top: string[];
   notes_heart: string[];
   notes_base: string[];
   gender: string | null;
   accent_color: string | null;
   seo_title: string | null;
   seo_description: string | null;
   updated_at: string;
 };
 
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
   const supabase = publicClient();
   if (!supabase) return null;
   const { data, error } = await supabase
     .from("jf_products")
     .select(
       "id,category_id,title,slug,short_description,description,inspired_by,size_ml,price,compare_at_price,images,notes_top,notes_heart,notes_base,gender,accent_color,seo_title,seo_description,updated_at"
     )
     .eq("slug", slug)
     .eq("is_active", true)
     .maybeSingle();
 
   if (error || !data) return null;
 
   let category: { name: string; slug: string } | null = null;
   if (data.category_id) {
     const { data: catData } = await supabase
       .from("jf_categories")
       .select("name,slug")
       .eq("id", data.category_id)
       .maybeSingle();
     if (catData) {
       category = catData;
     }
   }
 
   return {
     id: data.id,
     category_id: data.category_id,
     category,
     title: data.title,
     slug: data.slug,
     short_description: data.short_description,
     description: data.description,
     inspired_by: data.inspired_by,
     size_ml: Number(data.size_ml) || 50,
     price: Number(data.price) || 0,
     compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
     images: Array.isArray(data.images) ? data.images : [],
     notes_top: Array.isArray(data.notes_top) ? data.notes_top : [],
     notes_heart: Array.isArray(data.notes_heart) ? data.notes_heart : [],
     notes_base: Array.isArray(data.notes_base) ? data.notes_base : [],
     gender: data.gender,
     accent_color: data.accent_color,
     seo_title: data.seo_title,
     seo_description: data.seo_description,
     updated_at: data.updated_at,
   };
 }
 
export async function getProductReviews(productId: string): Promise<ApprovedReview[]> {
   const supabase = publicClient();
   if (!supabase) return [];
   const { data, error } = await supabase
     .from("jf_reviews")
     .select("id,author_name,rating,body")
     .eq("product_id", productId)
     .eq("is_approved", true)
     .order("created_at", { ascending: false });
 
   if (error || !data) return [];
   return data.map((item) => ({
     id: item.id,
     author_name: item.author_name,
     rating: Number(item.rating) || 5,
     body: item.body,
   }));
 }
 
export async function getRelatedProducts(
   categoryId: string | null,
   excludeProductId: string,
   limit = 4
 ): Promise<ShopProduct[]> {
   const supabase = publicClient();
   if (!supabase) return [];
 
   if (categoryId) {
     const { data, error } = await supabase
       .from("jf_products")
       .select("id,title,slug,images,inspired_by,price,compare_at_price,size_ml,accent_color,category_id")
       .eq("category_id", categoryId)
       .eq("is_active", true)
       .neq("id", excludeProductId)
       .order("sort_order", { ascending: true, nullsFirst: false })
       .limit(limit);
 
     if (!error && data && data.length > 0) {
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
         category_id: item.category_id,
       }));
     }
   }
 
   // Fallback: other featured active products
   const { data, error } = await supabase
     .from("jf_products")
     .select("id,title,slug,images,inspired_by,price,compare_at_price,size_ml,accent_color,category_id")
     .eq("is_active", true)
     .neq("id", excludeProductId)
     .order("is_featured", { ascending: false })
     .order("sort_order", { ascending: true, nullsFirst: false })
     .limit(limit);
 
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
     category_id: item.category_id,
   }));
 }
 
export async function getAllActiveSlugs(): Promise<{
   products: Array<{ slug: string; updated_at: string }>;
   categories: Array<{ slug: string; updated_at: string }>;
 }> {
   const supabase = publicClient();
   if (!supabase) return { products: [], categories: [] };
   const [prodRes, catRes] = await Promise.all([
     supabase.from("jf_products").select("slug,updated_at").eq("is_active", true),
     supabase.from("jf_categories").select("slug,updated_at").eq("is_active", true),
   ]);
   return {
     products: prodRes.data ?? [],
     categories: catRes.data ?? [],
   };
 }

export type PageSEO = {
  page_key: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
};

const loadPagesSEO = unstable_cache(
  async (): Promise<Record<string, PageSEO>> => {
    const supabase = publicClient();
    if (!supabase) return {};
    const { data, error } = await supabase
      .from("jf_pages_seo")
      .select("page_key,seo_title,seo_description,og_image_url");

    if (error || !data) return {};
    const map: Record<string, PageSEO> = {};
    for (const row of data) {
      map[row.page_key] = row;
    }
    return map;
  },
  ["jf-pages-seo-v1"],
  { revalidate: 60, tags: ["pages-seo"] }
);

export const getPagesSEO = () => loadPagesSEO();

export async function getPageSEO(pageKey: string): Promise<PageSEO | null> {
  const all = await getPagesSEO();
  return all[pageKey] ?? null;
}

export type BlogPostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  content: string | null;
  status: "draft" | "published";
  show_on_page: string | null;
  faq: Array<{ question: string; answer: string }>;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

const loadPublishedBlogPosts = unstable_cache(
  async (): Promise<BlogPostItem[]> => {
    const supabase = publicClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("jf_blog_posts")
      .select("id,title,slug,excerpt,cover_image_url,published_at,created_at,content,status,show_on_page,faq,seo_title,seo_description,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error || !data) return [];
    return data.map((item) => ({
      ...item,
      faq: Array.isArray(item.faq) ? item.faq : [],
    }));
  },
  ["jf-published-blog-posts-v1"],
  { revalidate: 60, tags: ["blog-posts"] }
);

export const getPublishedBlogPosts = () => loadPublishedBlogPosts();

export async function getBlogPostBySlug(slug: string): Promise<BlogPostItem | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("jf_blog_posts")
    .select("id,title,slug,excerpt,cover_image_url,published_at,created_at,content,status,show_on_page,faq,seo_title,seo_description,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...data,
    faq: Array.isArray(data.faq) ? data.faq : [],
  };
}

export async function getPlacementPosts(placement: string, limit = 3): Promise<BlogPostItem[]> {
  const all = await getPublishedBlogPosts();
  return all.filter((p) => p.show_on_page === placement).slice(0, limit);
}

export async function getAllActiveBlogSlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  const supabase = publicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("jf_blog_posts")
    .select("slug,updated_at")
    .eq("status", "published");
  return data ?? [];
}
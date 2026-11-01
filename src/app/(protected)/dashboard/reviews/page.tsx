import { requireAdmin } from "@/lib/auth/require-admin";
import { ReviewsManager, type ReviewRecord } from "./reviews-manager";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const { supabase } = await requireAdmin();
  const [reviewsResult, productsResult] = await Promise.all([
    supabase.from("jf_reviews").select("id,product_id,author_name,rating,body,is_approved,created_at").order("created_at", { ascending: false }),
    supabase.from("jf_products").select("id,title,slug").order("title"),
  ]);
  if (reviewsResult.error || productsResult.error) throw new Error("Unable to load reviews.");

  const products = productsResult.data ?? [];
  const titles = new Map(products.map((product) => [product.id, product.title]));
  const reviews: ReviewRecord[] = (reviewsResult.data ?? []).map((review) => ({
    ...review,
    rating: Number(review.rating),
    body: review.body ?? "",
    product_title: titles.get(review.product_id) ?? "Unavailable product",
  }));

  return <section className="mx-auto w-full max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold text-slate-950">Reviews</h1><p className="mt-1 text-sm text-slate-600">Manage customer reviews after checking the customer’s message or screenshot.</p></div><ReviewsManager initialReviews={reviews} products={products} /></section>;
}

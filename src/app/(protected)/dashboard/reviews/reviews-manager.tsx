"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/dashboard/ui/button";
import { ConfirmDialog } from "@/components/dashboard/ui/confirm-dialog";
import { Input } from "@/components/dashboard/ui/input";
import { Select } from "@/components/dashboard/ui/select";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Toggle } from "@/components/dashboard/ui/toggle";
import { Toast } from "@/components/dashboard/ui/toast";
import { deleteReview, saveReview } from "./actions";

export type ReviewRecord = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  body: string;
  is_approved: boolean;
  created_at: string;
  product_title: string;
};

type ProductOption = { id: string; title: string; slug: string };
type ReviewForm = { id?: string; product_id: string; author_name: string; rating: number; body: string; is_approved: boolean; has_real_review: boolean };
const blankForm = (productId = ""): ReviewForm => ({ product_id: productId, author_name: "", rating: 5, body: "", is_approved: false, has_real_review: false });
type Filter = "all" | "approved" | "pending";

export function ReviewsManager({ initialReviews, products }: { initialReviews: ReviewRecord[]; products: ProductOption[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [deleting, setDeleting] = useState<ReviewRecord | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const visibleReviews = useMemo(() => initialReviews.filter((review) => filter === "all" || (filter === "approved" ? review.is_approved : !review.is_approved)), [filter, initialReviews]);
  const update = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => setForm((current) => current ? { ...current, [key]: value } : current);

  const edit = (review?: ReviewRecord) => {
    setError("");
    setForm(review ? { id: review.id, product_id: review.product_id, author_name: review.author_name, rating: review.rating, body: review.body, is_approved: review.is_approved, has_real_review: false } : blankForm(products[0]?.id ?? ""));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    startTransition(async () => {
      const result = await saveReview(form);
      if (!result.ok) { setError(result.message); return; }
      setForm(null);
      setToast({ message: result.message, tone: "success" });
      router.refresh();
    });
  };

  const remove = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteReview(deleting.id);
      setDeleting(null);
      setToast({ message: result.message, tone: result.ok ? "success" : "error" });
      if (result.ok) router.refresh();
    });
  };

  return <>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">{initialReviews.length} reviews</p>
      <Button onClick={() => edit()}>Add review</Button>
    </div>
    <div aria-label="Filter reviews" className="mb-5 flex flex-wrap gap-2" role="group">
      {(["all", "approved", "pending"] as const).map((value) => <Button aria-pressed={filter === value} className="capitalize" key={value} onClick={() => setFilter(value)} variant={filter === value ? "primary" : "secondary"}>{value}</Button>)}
    </div>
    {visibleReviews.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No {filter === "all" ? "reviews" : `${filter} reviews`} yet.</div> : <ul className="space-y-3">{visibleReviews.map((review) => <li className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" key={review.id}>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium text-slate-950">{review.author_name}</h2><span className={`rounded-full px-2 py-1 text-xs font-medium ${review.is_approved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{review.is_approved ? "Approved" : "Pending"}</span></div><p className="mt-1 text-sm text-slate-600">{review.product_title} · {review.rating}/5</p>{review.body ? <p className="mt-2 break-words text-sm leading-6 text-slate-700">{review.body}</p> : <p className="mt-2 text-sm italic text-slate-500">No written text.</p>}</div>
      <div className="flex gap-2"><Button className="px-3" onClick={() => edit(review)} variant="secondary">Edit</Button><Button aria-label={`Delete review by ${review.author_name}`} className="px-3" onClick={() => setDeleting(review)} variant="secondary">Delete</Button></div>
    </li>)}</ul>}
    {form ? <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/40 p-3 sm:p-6"><section aria-labelledby="review-form-title" aria-modal="true" className="mx-auto my-3 w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl sm:p-6" role="dialog"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold" id="review-form-title">{form.id ? "Edit review" : "Add review"}</h2><Button onClick={() => setForm(null)} variant="secondary">Close</Button></div>
      <form className="grid min-w-0 gap-4 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2"><Select label="Product" name="product_id" onChange={(event) => update("product_id", event.target.value)} required value={form.product_id} options={[{ label: "Choose a product", value: "" }, ...products.map((product) => ({ label: product.title, value: product.id }))]} /></div>
        <Input autoComplete="name" label="Author name" maxLength={40} name="author_name" onChange={(event) => update("author_name", event.target.value)} placeholder="Ayesha, Karachi" required value={form.author_name} />
        <Select label="Rating" name="rating" onChange={(event) => update("rating", Number(event.target.value))} value={String(form.rating)} options={[1, 2, 3, 4, 5].map((rating) => ({ label: `${rating} out of 5`, value: String(rating) }))} />
        <div className="sm:col-span-2"><Textarea hint={`${form.body.length}/400`} label="Review text" maxLength={400} name="body" onChange={(event) => update("body", event.target.value)} value={form.body} /></div>
        <div className="sm:col-span-2"><Toggle checked={form.is_approved} label="Approved" onChange={(checked) => update("is_approved", checked)} /></div>
        <label className="flex min-h-11 items-start gap-3 rounded-md border border-slate-300 p-3 text-sm leading-6 text-slate-800 sm:col-span-2"><input checked={form.has_real_review} className="mt-1 h-5 w-5 shrink-0" onChange={(event) => update("has_real_review", event.target.checked)} required type="checkbox" /><span>This is a real customer review (I have the customer&apos;s message or screenshot).</span></label>
        {error ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2"><Button onClick={() => setForm(null)} type="button" variant="secondary">Cancel</Button><Button disabled={pending || products.length === 0} type="submit">{pending ? "Saving..." : "Save review"}</Button></div>
      </form>
    </section></div> : null}
    <ConfirmDialog open={Boolean(deleting)} pending={pending} title="Delete review?" message={`Delete the review by ${deleting?.author_name ?? "this customer"}? This cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={remove} />
    {toast ? <Toast message={toast.message} onDismiss={() => setToast(null)} tone={toast.tone} /> : null}
  </>;
}

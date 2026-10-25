"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/dashboard/ui/button";
import { ConfirmDialog } from "@/components/dashboard/ui/confirm-dialog";
import { Input } from "@/components/dashboard/ui/input";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Toggle } from "@/components/dashboard/ui/toggle";
import { Toast } from "@/components/dashboard/ui/toast";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { deleteCategory, saveCategory } from "./actions";

type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number | null; is_active: boolean; seo_title: string | null; seo_description: string | null; product_count: number };
type Form = { id?: string; name: string; slug: string; description: string; image_url: string; sort_order: number; is_active: boolean; seo_title: string; seo_description: string };
const blank: Form = { name: "", slug: "", description: "", image_url: "", sort_order: 0, is_active: true, seo_title: "", seo_description: "" };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const notify = (message: string, ok: boolean) => setToast({ message, tone: ok ? "success" : "error" });
  const update = (key: keyof Form, value: string | boolean | number) => setForm((current) => current ? { ...current, [key]: value } : current);
  const edit = (category?: Category) => {
    setError(""); setSlugEdited(Boolean(category));
    setForm(category ? { id: category.id, name: category.name, slug: category.slug, description: category.description ?? "", image_url: category.image_url ?? "", sort_order: category.sort_order ?? 0, is_active: category.is_active, seo_title: category.seo_title ?? "", seo_description: category.seo_description ?? "" } : { ...blank });
  };
  const submit = () => {
    if (!form) return;
    startTransition(async () => {
      const result = await saveCategory(form);
      if (!result.ok) { setError(result.message); return; }
      setForm(null); notify(result.message, true); router.refresh();
    });
  };
  const remove = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCategory(deleting.id);
      setDeleting(null); notify(result.message, result.ok); if (result.ok) router.refresh();
    });
  };

  return <>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-600">{categories.length} categories, including inactive.</p><Button onClick={() => edit()}>Add category</Button></div>
    {categories.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No categories yet. Add your first category.</div> : <ul className="space-y-3">{categories.map((category) => <li className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3" key={category.id}>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-slate-100">{category.image_url ? <Image alt="" className="object-cover" fill sizes="56px" src={category.image_url} unoptimized /> : null}</div>
      <div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-950">{category.name}</p><p className="truncate text-xs text-slate-500">{category.product_count} products · {category.is_active ? "Active" : "Inactive"}</p></div>
      <div className="flex shrink-0 gap-2"><Button className="px-3" onClick={() => edit(category)} variant="secondary">Edit</Button><Button aria-label={`Delete ${category.name}`} className="px-3" onClick={() => setDeleting(category)} variant="secondary">Delete</Button></div>
    </li>)}</ul>}
    {form ? <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/40 p-3 sm:p-6"><section aria-labelledby="category-form-title" aria-modal="true" className="mx-auto my-3 w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl sm:p-6" role="dialog"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold" id="category-form-title">{form.id ? "Edit category" : "Add category"}</h2><Button onClick={() => setForm(null)} variant="secondary">Close</Button></div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2"><Input label="Name" maxLength={120} onChange={(e) => { const name = e.target.value; setForm((current) => current ? { ...current, name, slug: slugEdited ? current.slug : slugify(name) } : current); }} value={form.name} /><Input label="Slug" onChange={(e) => { setSlugEdited(true); update("slug", e.target.value); }} value={form.slug} /><Textarea className="sm:col-span-2" label="Description" onChange={(e) => update("description", e.target.value)} value={form.description} /><div className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Image</span><ImageUploader kind="categories" multiple={false} onChange={(images) => update("image_url", images[0] ?? "")} value={form.image_url ? [form.image_url] : []} /></div><Input label="Sort order" min={-100000} onChange={(e) => update("sort_order", Number(e.target.value))} type="number" value={form.sort_order} /><div className="flex items-end"><Toggle checked={form.is_active} label="Active" onChange={(checked) => update("is_active", checked)} /></div><Input label="SEO title" maxLength={120} onChange={(e) => update("seo_title", e.target.value)} value={form.seo_title} /><p className="self-end pb-3 text-xs text-slate-500">{form.seo_title.length}/60 recommended</p><div className="sm:col-span-2"><Textarea label="SEO description" maxLength={300} onChange={(e) => update("seo_description", e.target.value)} value={form.seo_description} /><p className="mt-1 text-right text-xs text-slate-500">{form.seo_description.length}/155 recommended</p></div></div>
      {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}<div className="mt-5 flex justify-end gap-2"><Button onClick={() => setForm(null)} variant="secondary">Cancel</Button><Button disabled={pending} onClick={submit}>{pending ? "Saving..." : "Save category"}</Button></div>
    </section></div> : null}
    <ConfirmDialog open={Boolean(deleting)} pending={pending} title="Delete category?" message="A category with products cannot be deleted." onCancel={() => setDeleting(null)} onConfirm={remove} />
    {toast ? <Toast message={toast.message} onDismiss={() => setToast(null)} tone={toast.tone} /> : null}
  </>;
}
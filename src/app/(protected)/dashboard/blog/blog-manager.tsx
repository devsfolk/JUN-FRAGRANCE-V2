"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Textarea } from "@/components/dashboard/ui/textarea";

import { ImageUploader } from "@/components/dashboard/image-uploader";
import { ConfirmDialog } from "@/components/dashboard/ui/confirm-dialog";
import { Toast } from "@/components/dashboard/ui/toast";
import { MarkdownContent } from "@/components/site/markdown-content";
import { saveBlogPost, deleteBlogPost } from "./actions";

export interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  status: "draft" | "published";
  show_on_page: string;
  faq: Array<{ question: string; answer: string }>;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
}

interface BlogManagerProps {
  initialPosts: BlogPostRecord[];
  activeCategories: Array<{ name: string; slug: string }>;
  activeProducts: Array<{ title: string; slug: string }>;
}

export function BlogManager({
  initialPosts,
  activeCategories,
  activeProducts,
}: BlogManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostRecord[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [editingPost, setEditingPost] = useState<BlogPostRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPostRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  // Form State for active post
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image_url: string;
    status: "draft" | "published";
    show_on_page: string;
    faq: Array<{ question: string; answer: string }>;
    seo_title: string;
    seo_description: string;
  }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    status: "draft",
    show_on_page: "journal",
    faq: [],
    seo_title: "",
    seo_description: "",
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const startCreate = () => {
    setIsCreating(true);
    setEditingPost(null);
    setPreviewMode(false);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      status: "draft",
      show_on_page: "journal",
      faq: [],
      seo_title: "",
      seo_description: "",
    });
  };

  const startEdit = (post: BlogPostRecord) => {
    setEditingPost(post);
    setIsCreating(false);
    setPreviewMode(false);
    setFormData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image_url: post.cover_image_url || "",
      status: post.status,
      show_on_page: post.show_on_page || "journal",
      faq: post.faq || [],
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
    });
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingPost(null);
    setPreviewMode(false);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [posts, search, statusFilter]);

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveBlogPost(formData);
      if (res.ok) {
        const savedStatus = res.post?.status ?? formData.status;
        const statusLabel = savedStatus === "published" ? "Published" : "Draft";
        setToast({ message: `Saved as ${statusLabel}`, tone: "success" });
        setIsCreating(false);
        setEditingPost(null);
        // Refresh local list with actual DB id and status
        setPosts((prev) => {
          if (formData.id) {
            return prev.map((p) =>
              p.id === formData.id
                ? {
                    ...p,
                    ...formData,
                    status: savedStatus,
                    published_at: res.post?.published_at ?? p.published_at,
                  }
                : p
            );
          } else {
            const newPost: BlogPostRecord = {
              id: res.post?.id ?? crypto.randomUUID(),
              ...formData,
              status: savedStatus,
              published_at: res.post?.published_at ?? (savedStatus === "published" ? new Date().toISOString() : null),
              created_at: new Date().toISOString(),
            };
            return [newPost, ...prev];
          }
        });
        router.refresh();
      } else {
        setToast({ message: res.message || "Failed to save post.", tone: "error" });
      }
    });
  };

  // Handle Delete
  const handleDelete = () => {
    if (!postToDelete) return;
    startTransition(async () => {
      const res = await deleteBlogPost(postToDelete.id);
      if (res.ok) {
        setToast({ message: res.message || "Post deleted.", tone: "success" });
        setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
        setPostToDelete(null);
      } else {
        setToast({ message: res.message || "Failed to delete post.", tone: "error" });
      }
    });
  };

  // Markdown Toolbar actions
  const insertMarkdown = (syntax: string, wrapper = false) => {
    const textarea = document.getElementById("blog-content-input") as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = formData.content.substring(start, end);

    let replacement = "";
    if (wrapper) {
      replacement = `${syntax}${selection || "text"}${syntax}`;
    } else {
      replacement = `\n${syntax} ${selection}\n`;
    }

    const next = formData.content.substring(0, start) + replacement + formData.content.substring(end);
    setFormData({ ...formData, content: next });
  };

  // FAQ handlers
  const addFaqRow = () => {
    setFormData({
      ...formData,
      faq: [...formData.faq, { question: "", answer: "" }],
    });
  };

  const updateFaqRow = (index: number, patch: Partial<{ question: string; answer: string }>) => {
    const next = [...formData.faq];
    if (next[index]) {
      next[index] = { ...next[index], ...patch };
      setFormData({ ...formData, faq: next });
    }
  };

  const removeFaqRow = (index: number) => {
    setFormData({
      ...formData,
      faq: formData.faq.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8 pb-24">
      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      {/* Confirm Delete Dialog */}
      {postToDelete ? (
        <ConfirmDialog
          title="Delete Article"
          message={`Are you sure you want to permanently delete "${postToDelete.title}"? This cannot be undone and will remove its cover image from storage.`}
          confirmLabel="Delete article"
          open={true}
          onCancel={() => setPostToDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      {/* VIEW: Post List or Post Editor */}
      {!isCreating && !editingPost ? (
        <section className="space-y-6">
          {/* Top Controls: Search, Status filter, New Post button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder="Search articles by title or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
                {(["all", "draft", "published"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-md px-3 py-1 font-medium capitalize transition-colors ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <Button type="button" onClick={startCreate}>
              + New Article
            </Button>
          </div>

          {/* Posts List */}
          {filteredPosts.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-200">
                {filteredPosts.map((post) => (
                  <li
                    key={post.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50"
                  >
                    <div className="flex items-start gap-4">
                      {post.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.cover_image_url}
                          alt=""
                          className="h-16 w-24 shrink-0 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-16 w-24 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                          NO COVER
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              post.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {post.status}
                          </span>
                          <span className="text-xs text-slate-400">/{post.slug}</span>
                        </div>

                        <h3 className="font-serif text-lg font-medium text-slate-900">
                          {post.title}
                        </h3>

                        {post.excerpt ? (
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {post.excerpt}
                          </p>
                        ) : null}

                        <p className="text-[11px] text-slate-400">
                          Placement: <span className="font-medium text-slate-600">{post.show_on_page || "journal"}</span>
                          {post.published_at ? ` • Published ${new Date(post.published_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {post.status === "published" ? (
                        <Link
                          href={`/journal/${post.slug}`}
                          target="_blank"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View ↗
                        </Link>
                      ) : null}

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(post)}
                        className="text-xs py-1.5 px-3"
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setPostToDelete(post)}
                        className="text-xs py-1.5 px-3 text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="font-serif text-xl text-slate-900">No articles found</p>
              <p className="mt-1 text-xs text-slate-500">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Start sharing stories, fragrance guides, and notes."}
              </p>
              {!search && statusFilter === "all" ? (
                <Button type="button" onClick={startCreate} className="mt-4">
                  Create your first article
                </Button>
              ) : null}
            </div>
          )}
        </section>
      ) : (
        /* EDITOR VIEW */
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-medium text-slate-900">
                {isCreating ? "New Article" : `Edit: ${formData.title}`}
              </h2>
              <p className="text-xs text-slate-500">
                {formData.status === "published" ? "Live on site" : "Draft (not visible to public)"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Article"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Main Content */}
            <div className="space-y-6 lg:col-span-2">
              <Input
                label="Article Title"
                type="text"
                placeholder="e.g. The Art of Layering Fragrances in Warm Climates"
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    title: val,
                    slug: isCreating ? slugify(val) : formData.slug,
                  });
                }}
              />

              <Input
                label="Slug (URL identifier)"
                type="text"
                placeholder="the-art-of-layering-fragrances"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
              />

              <Textarea
                label="Excerpt / Summary"
                rows={3}
                placeholder="A brief preview shown in journal cards and search engine snippets..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />

              {/* Markdown Editor with Toolbar and Preview Toggle */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm font-medium text-slate-800">
                    Content (Markdown)
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        !previewMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        previewMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {!previewMode ? (
                  <div className="mt-3 space-y-2">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => insertMarkdown("**", true)}
                        className="rounded px-2 py-1 font-bold hover:bg-slate-200"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("##")}
                        className="rounded px-2 py-1 font-semibold hover:bg-slate-200"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("###")}
                        className="rounded px-2 py-1 font-semibold hover:bg-slate-200"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("-")}
                        className="rounded px-2 py-1 hover:bg-slate-200"
                        title="Bullet List"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("[link text](https://example.com)")}
                        className="rounded px-2 py-1 hover:bg-slate-200"
                        title="Insert Link"
                      >
                        🔗 Link
                      </button>
                    </div>

                    <textarea
                      id="blog-content-input"
                      rows={14}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your article in Markdown..."
                      className="w-full rounded-md border border-slate-300 p-3 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                    />

                    {/* Image inserter helper */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-700">
                        Upload & Insert Image into content:
                      </p>
                      <div className="mt-2">
                        <ImageUploader
                          value={[]}
                          onChange={(urls) => {
                            if (urls[0]) {
                              insertMarkdown(`\n![Image description](${urls[0]})\n`);
                            }
                          }}
                          kind="blog"
                          multiple={false}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 min-h-[300px] rounded-lg border border-slate-100 bg-ink p-6">
                    <MarkdownContent content={formData.content || "*No content written yet.*"} />
                  </div>
                )}
              </div>

              {/* Repeatable FAQ Editor */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Frequently Asked Questions (FAQ)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rendered on the article and emitted as FAQPage JSON-LD for Answer Engine Optimization.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={addFaqRow} className="text-xs">
                    + Add Q&A
                  </Button>
                </div>

                {formData.faq.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {formData.faq.map((row, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 p-3.5 space-y-2 bg-slate-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Question #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFaqRow(idx)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. How long does the fragrance last?"
                          value={row.question}
                          onChange={(e) => updateFaqRow(idx, { question: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                        />
                        <textarea
                          rows={2}
                          placeholder="Detailed answer..."
                          value={row.answer}
                          onChange={(e) => updateFaqRow(idx, { answer: e.target.value })}
                          className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">No FAQ entries added yet.</p>
                )}
              </div>
            </div>

            {/* Right Column: Settings & SEO */}
            <div className="space-y-6">
              {/* Status & Placement */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                {/* Publish Status */}
                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-800">
                  <span>Publish Status</span>
                  <select
                    className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
                  >
                    <option value="draft">Draft (hidden)</option>
                    <option value="published">Published (live)</option>
                  </select>
                </label>

                {/* Show on Page Selection */}
                <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-800">
                  <span>Show this post on</span>
                  <select
                    className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    value={formData.show_on_page}
                    onChange={(e) => setFormData({ ...formData, show_on_page: e.target.value })}
                  >
                    <option value="journal">Journal only (Default)</option>
                    <option value="home">Home page (&ldquo;From the journal&rdquo;)</option>
                    <optgroup label="Category Placement">
                      {activeCategories.map((c) => (
                        <option key={c.slug} value={`category:${c.slug}`}>
                          Category: {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Product Placement">
                      {activeProducts.map((p) => (
                        <option key={p.slug} value={`product:${p.slug}`}>
                          Product: {p.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
              </div>

              {/* Cover Image */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <label className="block text-sm font-medium text-slate-800">
                  Cover Image
                </label>
                <p className="text-xs text-slate-500">
                  Stored under blog/ in WebP. Max 5 MB original.
                </p>
                <ImageUploader
                  value={formData.cover_image_url ? [formData.cover_image_url] : []}
                  onChange={(urls) => setFormData({ ...formData, cover_image_url: urls[0] || "" })}
                  kind="blog"
                  multiple={false}
                />
              </div>

              {/* SEO Meta */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  SEO Meta Tags
                </h3>

                <Input
                  label={`SEO Title (${formData.seo_title.length}/60 chars)`}
                  type="text"
                  placeholder="Custom title tag..."
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                />

                <Textarea
                  label={`SEO Description (${formData.seo_description.length}/155 chars)`}
                  rows={3}
                  placeholder="Custom meta description..."
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Sticky Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm sm:left-64">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Article"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

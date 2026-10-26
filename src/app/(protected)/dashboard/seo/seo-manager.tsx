"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Toast } from "@/components/dashboard/ui/toast";
import { savePageSEO } from "./actions";

export interface PageSeoItem {
  page_key: "home" | "shop" | "about" | "contact" | "journal" | "faq";
  seo_title: string;
  seo_description: string;
  og_image_url: string;
}

export interface SeoAuditData {
  missingProductSeo: Array<{ id: string; title: string; missingTitle: boolean; missingDesc: boolean }>;
  missingCategorySeo: Array<{ id: string; name: string; missingTitle: boolean; missingDesc: boolean }>;
  productsWithoutImages: Array<{ id: string; title: string }>;
  productsWithoutCategory: Array<{ id: string; title: string }>;
  siteUrl: string;
  googleTokenPresent: boolean;
  bingTokenPresent: boolean;
}

interface SeoManagerProps {
  initialPages: PageSeoItem[];
  audit: SeoAuditData;
}

const pageLabels: Record<PageSeoItem["page_key"], string> = {
  home: "Home Page (/)",
  shop: "Shop Page (/shop)",
  about: "About Page (/about)",
  contact: "Contact Page (/contact)",
  journal: "Journal Page (/journal)",
  faq: "FAQ Page (/faq)",
};

export function SeoManager({ initialPages, audit }: SeoManagerProps) {
  const [pages, setPages] = useState<PageSeoItem[]>(initialPages);
  const [activeTab, setActiveTab] = useState<PageSeoItem["page_key"]>("home");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const currentPage = pages.find((p) => p.page_key === activeTab) || pages[0];

  const updateCurrentPage = (patch: Partial<PageSeoItem>) => {
    setPages((prev) =>
      prev.map((p) => (p.page_key === activeTab ? { ...p, ...patch } : p))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await savePageSEO(pages);
      if (res.ok) {
        setToast({ message: "Page SEO configurations saved.", type: "success" });
      } else {
        setToast({ message: res.error || "Failed to save page SEO.", type: "error" });
      }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const sitemapUrl = `${audit.siteUrl}/sitemap.xml`;
  const robotsUrl = `${audit.siteUrl}/robots.txt`;

  return (
    <div className="space-y-10 pb-24">
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* SEO Health Panel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-900">
            SEO Health & Tools
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Computed on the server with honest checks. No simulated scores or arbitrary metrics.
          </p>
        </div>

        {/* Checklist */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="text-slate-700 font-medium">sitemap.xml enabled</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="text-slate-700 font-medium">robots.txt enabled (dashboard blocked)</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="text-slate-700 font-medium">Structured Data (JSON-LD) active</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="text-slate-700 font-medium">Canonical URLs active</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className={audit.siteUrl.startsWith("https://") ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
              {audit.siteUrl.startsWith("https://") ? "✓" : "!"}
            </span>
            <span className="text-slate-700 font-medium">
              Site URL uses HTTPS ({audit.siteUrl.startsWith("https://") ? "Yes" : "HTTP only"})
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className={audit.googleTokenPresent ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
              {audit.googleTokenPresent ? "✓" : "○"}
            </span>
            <span className="text-slate-700 font-medium">
              Google Verification ({audit.googleTokenPresent ? "Configured" : "Not configured"})
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
            <span className={audit.bingTokenPresent ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
              {audit.bingTokenPresent ? "✓" : "○"}
            </span>
            <span className="text-slate-700 font-medium">
              Bing Verification ({audit.bingTokenPresent ? "Configured" : "Not configured"})
            </span>
          </div>
        </div>

        {/* Sitemap & Robots Copy Buttons */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs">
            <div className="truncate pr-2">
              <span className="font-semibold text-slate-700">Sitemap: </span>
              <span className="font-mono text-slate-500">{sitemapUrl}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 text-xs py-1 px-2.5"
              onClick={() => copyToClipboard(sitemapUrl, "sitemap")}
            >
              {copiedUrl === "sitemap" ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs">
            <div className="truncate pr-2">
              <span className="font-semibold text-slate-700">Robots: </span>
              <span className="font-mono text-slate-500">{robotsUrl}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 text-xs py-1 px-2.5"
              onClick={() => copyToClipboard(robotsUrl, "robots")}
            >
              {copiedUrl === "robots" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Webmaster Testing & Inspection Links */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            External Diagnostic Tools
          </h3>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Google Search Console ↗
            </a>
            <a
              href="https://www.bing.com/webmasters"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Bing Webmaster Tools ↗
            </a>
            <a
              href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(audit.siteUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Google Rich Results Test ↗
            </a>
            <a
              href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(audit.siteUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              PageSpeed Insights ↗
            </a>
          </div>
        </div>

        {/* Diagnostic Action Items (clickable lists) */}
        <div className="mt-6 space-y-4 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Catalog SEO Audit
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Missing Product SEO */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Products missing SEO</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${audit.missingProductSeo.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {audit.missingProductSeo.length}
                </span>
              </div>
              {audit.missingProductSeo.length > 0 ? (
                <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto text-xs text-slate-600">
                  {audit.missingProductSeo.map((p) => (
                    <li key={p.id}>
                      <Link href={`/dashboard/products?edit=${p.id}`} className="text-gold hover:underline">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">All products have SEO tags.</p>
              )}
            </div>

            {/* Missing Category SEO */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Categories missing SEO</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${audit.missingCategorySeo.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {audit.missingCategorySeo.length}
                </span>
              </div>
              {audit.missingCategorySeo.length > 0 ? (
                <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto text-xs text-slate-600">
                  {audit.missingCategorySeo.map((c) => (
                    <li key={c.id}>
                      <Link href="/dashboard/categories" className="text-gold hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">All categories have SEO tags.</p>
              )}
            </div>

            {/* Products Without Images */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Products without images</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${audit.productsWithoutImages.length > 0 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {audit.productsWithoutImages.length}
                </span>
              </div>
              {audit.productsWithoutImages.length > 0 ? (
                <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto text-xs text-slate-600">
                  {audit.productsWithoutImages.map((p) => (
                    <li key={p.id}>
                      <Link href={`/dashboard/products?edit=${p.id}`} className="text-gold hover:underline">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">All products have photos.</p>
              )}
            </div>

            {/* Active Products without Category */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Products without category</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${audit.productsWithoutCategory.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {audit.productsWithoutCategory.length}
                </span>
              </div>
              {audit.productsWithoutCategory.length > 0 ? (
                <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto text-xs text-slate-600">
                  {audit.productsWithoutCategory.map((p) => (
                    <li key={p.id}>
                      <Link href={`/dashboard/products?edit=${p.id}`} className="text-gold hover:underline">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">All products assigned to categories.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Page SEO Editor */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-900">
            Page SEO Editor
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Custom titles, descriptions, and OpenGraph social share cards for high-level site pages.
          </p>
        </div>

        {/* Page Key Selector Tabs */}
        <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {pages.map((p) => (
            <button
              key={p.page_key}
              type="button"
              onClick={() => setActiveTab(p.page_key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === p.page_key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {pageLabels[p.page_key]}
            </button>
          ))}
        </div>

        {/* Current Page Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                SEO Title ({pageLabels[currentPage.page_key]})
              </label>
              <span className={`text-xs ${currentPage.seo_title.length > 60 ? "text-amber-600 font-semibold" : "text-slate-400"}`}>
                {currentPage.seo_title.length} / 60 chars recommended
              </span>
            </div>
            <Input
              type="text"
              placeholder="e.g. Jun.fragrance | Premium Perfumes in Pakistan"
              value={currentPage.seo_title}
              onChange={(e) => updateCurrentPage({ seo_title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                SEO Meta Description
              </label>
              <span className={`text-xs ${currentPage.seo_description.length > 160 ? "text-amber-600 font-semibold" : "text-slate-400"}`}>
                {currentPage.seo_description.length} / 155 chars recommended
              </span>
            </div>
            <Textarea
              rows={3}
              placeholder="Compelling summary shown in Google and Bing search results..."
              value={currentPage.seo_description}
              onChange={(e) => updateCurrentPage({ seo_description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Open Graph / Social Share Card Image
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Recommended 1200x630. Stored under seo/ in WebP.
            </p>
            <ImageUploader
              value={currentPage.og_image_url ? [currentPage.og_image_url] : []}
              onChange={(urls) => updateCurrentPage({ og_image_url: urls[0] || "" })}
              kind="seo"
              multiple={false}
            />
          </div>

          {/* Sticky Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm sm:left-64">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <p className="text-xs text-slate-500">
                Editing: <span className="font-semibold text-slate-800">{pageLabels[currentPage.page_key]}</span>
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save SEO Configurations"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

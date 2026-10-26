"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Toast } from "@/components/dashboard/ui/toast";
import { saveSettings, type SettingsFormData } from "./actions";

interface SettingsFormProps {
  initialData: SettingsFormData;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [data, setData] = useState<SettingsFormData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSettings(data);
      if (res.ok) {
        setToast({ message: "Settings saved successfully.", type: "success" });
      } else {
        setToast({ message: res.error || "Failed to save settings.", type: "error" });
      }
    });
  };

  const updateScene = (index: number, patch: Partial<SettingsFormData["hero_scenes"][number]>) => {
    const next = [...data.hero_scenes];
    if (next[index]) {
      next[index] = { ...next[index], ...patch };
      setData({ ...data, hero_scenes: next });
    }
  };

  const removeScene = (index: number) => {
    setData({
      ...data,
      hero_scenes: data.hero_scenes.filter((_, i) => i !== index),
    });
  };

  const moveScene = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= data.hero_scenes.length) return;
    const next = [...data.hero_scenes];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setData({ ...data, hero_scenes: next });
  };

  const addScene = (url: string) => {
    if (data.hero_scenes.length >= 4) return;
    setData({
      ...data,
      hero_scenes: [
        ...data.hero_scenes,
        {
          url,
          accent: "#C9A66B",
          alt: "Jun.fragrance perfume scene",
        },
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* 1. Contact Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-slate-900">
          1. WhatsApp & Contact
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Used across the public site for prefilled order links and customer inquiries.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              WhatsApp Number
            </label>
            <Input
              type="text"
              value={data.whatsapp_number}
              onChange={(e) =>
                setData({ ...data, whatsapp_number: e.target.value.replace(/\D/g, "") })
              }
              placeholder="923001234567"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              Example: 923001234567, no plus sign, no spaces. Digits only, 10 to 15 digits.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Social Links */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-slate-900">
          2. Social Media Links
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Direct profile links shown in the footer and included in Organization structured data. Must begin with https://.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Instagram</label>
            <Input
              type="url"
              placeholder="https://instagram.com/jun.fragrance"
              value={data.social_instagram}
              onChange={(e) => setData({ ...data, social_instagram: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">TikTok</label>
            <Input
              type="url"
              placeholder="https://tiktok.com/@jun.fragrance"
              value={data.social_tiktok}
              onChange={(e) => setData({ ...data, social_tiktok: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Facebook</label>
            <Input
              type="url"
              placeholder="https://facebook.com/junfragrance"
              value={data.social_facebook}
              onChange={(e) => setData({ ...data, social_facebook: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">YouTube</label>
            <Input
              type="url"
              placeholder="https://youtube.com/@junfragrance"
              value={data.social_youtube}
              onChange={(e) => setData({ ...data, social_youtube: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </section>

      {/* 3. Search Engine Verification */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-slate-900">
          3. Search Engine Verification
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Verification tokens to verify ownership in Google Search Console and Bing Webmaster Tools.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Google Site Verification Token
            </label>
            <Input
              type="text"
              placeholder="e.g. AbC123_xyz..."
              value={data.google_site_verification}
              onChange={(e) => setData({ ...data, google_site_verification: e.target.value.trim() })}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              In Google Search Console, select &ldquo;HTML tag&rdquo; method. Copy only the value inside content=&quot;...&quot; (not the entire tag).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Bing Webmaster Verification Token
            </label>
            <Input
              type="text"
              placeholder="e.g. 1A2B3C4D5E..."
              value={data.bing_site_verification}
              onChange={(e) => setData({ ...data, bing_site_verification: e.target.value.trim() })}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              In Bing Webmaster Tools, choose manual meta tag verification. Copy only the token value.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Business Info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-slate-900">
          4. Business Information
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          All optional. If an address is provided, LocalBusiness JSON-LD is automatically generated on the home page for local SEO.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">City</label>
              <Input
                type="text"
                placeholder="e.g. Lahore, Karachi, Islamabad"
                value={data.business_city}
                onChange={(e) => setData({ ...data, business_city: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Display Phone</label>
              <Input
                type="text"
                placeholder="e.g. +92 300 1234567"
                value={data.business_phone_display}
                onChange={(e) => setData({ ...data, business_phone_display: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Address / Location</label>
            <Input
              type="text"
              placeholder="e.g. Suite 402, MM Alam Road, Gulberg III"
              value={data.business_address}
              onChange={(e) => setData({ ...data, business_address: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </section>

      {/* 5. Hero Scenes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-medium text-slate-900">
              5. Hero Scenes (Spotlight Room)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Up to 4 cinematic background scene photos. When empty, the site falls back to static defaults.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {data.hero_scenes.length} / 4 scenes
          </span>
        </div>

        {/* Existing Scenes List */}
        <div className="mt-6 space-y-4">
          {data.hero_scenes.map((scene, index) => (
            <div
              key={scene.url + index}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
            >
              <div
                className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-36"
                style={{ borderLeft: `4px solid ${scene.accent}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scene.url}
                  alt={scene.alt}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-700">Accent Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={scene.accent}
                      onChange={(e) => updateScene(index, { accent: e.target.value })}
                      className="h-7 w-9 cursor-pointer rounded border border-slate-300"
                    />
                    <span className="font-mono text-xs uppercase text-slate-600">
                      {scene.accent}
                    </span>
                  </div>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Scene description / alt text"
                    value={scene.alt}
                    onChange={(e) => updateScene(index, { alt: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:flex-col">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index === 0}
                  onClick={() => moveScene(index, -1)}
                  className="px-2 py-1 text-xs"
                  aria-label="Move scene up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index === data.hero_scenes.length - 1}
                  onClick={() => moveScene(index, 1)}
                  className="px-2 py-1 text-xs"
                  aria-label="Move scene down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeScene(index)}
                  className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                  aria-label="Remove scene"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {/* Add Scene via ImageUploader (single image at a time, stored under hero/) */}
          {data.hero_scenes.length < 4 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
              <label className="mb-2 block text-xs font-medium text-slate-700">
                Add Scene Photo (Saved under hero/ in WebP)
              </label>
              <ImageUploader
                value={[]}
                onChange={(urls) => {
                  if (urls[0]) addScene(urls[0]);
                }}
                kind="hero"
                multiple={false}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm sm:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-xs text-slate-500">
            Changes will take effect immediately on the public storefront.
          </p>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}

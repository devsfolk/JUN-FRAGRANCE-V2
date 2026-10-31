"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Input } from "@/components/dashboard/ui/input";
import { Toggle } from "@/components/dashboard/ui/toggle";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Toast } from "@/components/dashboard/ui/toast";
import { saveSettings, type SettingsFormData } from "./actions";

interface SettingsFormProps {
  initialData: SettingsFormData;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [data, setData] = useState<SettingsFormData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSettings(data);
      if (res.ok) {
        setToast({ message: "Settings saved successfully.", tone: "success" });
      } else {
        setToast({ message: res.error || "Failed to save settings.", tone: "error" });
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
          tone={toast.tone}
          onDismiss={() => setToast(null)}
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
            <Input
              label="WhatsApp Number"
              type="text"
              value={data.whatsapp_number}
              onChange={(e) =>
                setData({ ...data, whatsapp_number: e.target.value.replace(/\D/g, "") })
              }
              placeholder="923001234567"
            />
            <p className="mt-1.5 text-xs text-slate-500">
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
          Direct profile links shown in the footer and included in Organization structured data. Must begin with https://. Empty removes the link.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Instagram"
            type="url"
            placeholder="https://instagram.com/jun.fragrance"
            value={data.social_instagram}
            onChange={(e) => setData({ ...data, social_instagram: e.target.value })}
          />

          <Input
            label="TikTok"
            type="url"
            placeholder="https://tiktok.com/@jun.fragrance"
            value={data.social_tiktok}
            onChange={(e) => setData({ ...data, social_tiktok: e.target.value })}
          />

          <Input
            label="Facebook"
            type="url"
            placeholder="https://facebook.com/junfragrance"
            value={data.social_facebook}
            onChange={(e) => setData({ ...data, social_facebook: e.target.value })}
          />

          <Input
            label="YouTube"
            type="url"
            placeholder="https://youtube.com/@junfragrance"
            value={data.social_youtube}
            onChange={(e) => setData({ ...data, social_youtube: e.target.value })}
          />
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
            <Input
              label="Google Site Verification Token"
              type="text"
              placeholder="e.g. AbC123_xyz..."
              value={data.google_site_verification}
              onChange={(e) => setData({ ...data, google_site_verification: e.target.value.trim() })}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              In Google Search Console, select &ldquo;HTML tag&rdquo; method. Copy only the value inside content=&quot;...&quot; (not the entire tag).
            </p>
          </div>

          <div>
            <Input
              label="Bing Webmaster Verification Token"
              type="text"
              placeholder="e.g. 1A2B3C4D5E..."
              value={data.bing_site_verification}
              onChange={(e) => setData({ ...data, bing_site_verification: e.target.value.trim() })}
            />
            <p className="mt-1.5 text-xs text-slate-500">
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
            <Input
              label="City"
              type="text"
              placeholder="e.g. Lahore, Karachi, Islamabad"
              value={data.business_city}
              onChange={(e) => setData({ ...data, business_city: e.target.value })}
            />

            <Input
              label="Display Phone"
              type="text"
              placeholder="e.g. +92 300 1234567"
              value={data.business_phone_display}
              onChange={(e) => setData({ ...data, business_phone_display: e.target.value })}
            />
          </div>

          <Input
            label="Address / Location"
            type="text"
            placeholder="e.g. Suite 402, MM Alam Road, Gulberg III"
            value={data.business_address}
            onChange={(e) => setData({ ...data, business_address: e.target.value })}
          />
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
                    label="Scene Alt Text"
                    type="text"
                    placeholder="Scene description / alt text"
                    value={scene.alt}
                    onChange={(e) => updateScene(index, { alt: e.target.value })}
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

      {/* 6. Logo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-900">
            6. Logo
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Displayed in the site header and footer instead of the text logo.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-500">
            Use a transparent PNG or WebP, ideally wider than tall.
          </p>

          <ImageUploader
            value={data.site_logo?.url ? [data.site_logo.url] : []}
            onChange={(urls) => {
              if (urls[0]) {
                setData({
                  ...data,
                  site_logo: {
                    url: urls[0],
                    alt: data.site_logo?.alt || "Jun.fragrance",
                  },
                });
              } else {
                setData({
                  ...data,
                  site_logo: null,
                });
              }
            }}
            kind="logo"
            multiple={false}
          />

          {data.site_logo?.url ? (
            <div className="max-w-md pt-2">
              <Input
                label="Logo Alt Text"
                type="text"
                placeholder="Jun.fragrance"
                value={data.site_logo.alt}
                onChange={(e) =>
                  setData({
                    ...data,
                    site_logo: {
                      url: data.site_logo!.url,
                      alt: e.target.value,
                    },
                  })
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                Defaults to &ldquo;Jun.fragrance&rdquo; if left blank.
              </p>
            </div>
          ) : null}

          {/* Logo + Name Switch */}
          <div className="pt-3 border-t border-slate-100 max-w-md">
            <Toggle
              label="Show brand name next to logo"
              checked={Boolean(data.logo_show_text)}
              onChange={(checked) => setData({ ...data, logo_show_text: checked })}
            />
            <p className="mt-1 text-xs text-slate-500">
              When enabled, displays &ldquo;Jun.fragrance&rdquo; next to the logo image in the header and footer.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Favicon */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-900">
            7. Favicon
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            The small icon displayed in browser tabs, bookmarks, and mobile home screens.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-500">
            Use a square image, at least 512x512 pixels. PNG with transparent background works best.
          </p>

          <ImageUploader
            value={data.site_favicon?.url ? [data.site_favicon.url] : []}
            onChange={(urls) => {
              if (urls[0]) {
                setData({
                  ...data,
                  site_favicon: {
                    url: urls[0],
                  },
                });
              } else {
                setData({
                  ...data,
                  site_favicon: null,
                });
              }
            }}
            kind="favicon"
            multiple={false}
          />
        </div>
      </section>

      {/* 8. Bundle */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-900">
            8. Build Your Own Bundle
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Promotion allowing customers to pick any 3 perfumes for a single fixed price.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <div className="max-w-md">
            <Toggle
              label="Enable Bundle feature"
              checked={Boolean(data.bundle_enabled)}
              onChange={(checked) => setData({ ...data, bundle_enabled: checked })}
            />
            <p className="mt-1 text-xs text-slate-500">
              When disabled, /bundle returns 404 and bundle links across the site are hidden.
            </p>
          </div>

          <div className="max-w-xs">
            <Input
              label="Bundle Price (PKR)"
              type="number"
              min={1}
              max={1000000}
              value={data.bundle_price}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setData({
                  ...data,
                  bundle_price: isNaN(val) ? 4500 : val,
                });
              }}
              placeholder="4500"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Fixed price for any 3 perfumes (1 to 1,000,000 PKR). Default is 4,500.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Custom Bundle Poster Banner
            </label>
            <p className="text-xs text-slate-500">
              Optional. When empty, the default poster (/bundle/bundle-poster-new.webp) is used.
            </p>
            <ImageUploader
              value={data.bundle_image?.url ? [data.bundle_image.url] : []}
              onChange={(urls) => {
                if (urls[0]) {
                  setData({
                    ...data,
                    bundle_image: {
                      url: urls[0],
                    },
                  });
                } else {
                  setData({
                    ...data,
                    bundle_image: null,
                  });
                }
              }}
              kind="bundle"
              multiple={false}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-slate-900">International and gifting</h2>
        <p className="mt-1 text-xs text-slate-500">Set international delivery charges from your courier quotes. Enabled countries require a shipping charge.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Toggle label="Enable international delivery" checked={data.intl_enabled} onChange={(checked) => setData({ ...data, intl_enabled: checked })} />
          <Input label="International price multiplier" type="number" min={1} max={50} value={data.intl_multiplier} onChange={(e) => setData({ ...data, intl_multiplier: Number(e.target.value) || 1 })} />
          <Input label="Exchange-rate buffer (%)" type="number" min={0} max={15} value={data.intl_fx_buffer_percent} onChange={(e) => setData({ ...data, intl_fx_buffer_percent: Number(e.target.value) || 0 })} />
        </div>
        <div className="mt-6 space-y-3">
          {data.intl_countries.map((country, index) => <div key={country.code} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_1fr_1.4fr] sm:items-center">
            <div><p className="text-sm font-medium text-slate-900">{country.name} · {country.currency}</p><p className="text-xs text-slate-500">{country.code}</p><Toggle label="Enabled" checked={country.enabled} onChange={(checked) => { const rows = [...data.intl_countries]; rows[index] = { ...country, enabled: checked && country.shipping_pkr !== null }; setData({ ...data, intl_countries: rows }); }} /></div>
            <Input label="Shipping (PKR)" type="number" min={1} max={1000000} value={country.shipping_pkr ?? ""} onChange={(e) => { const rows = [...data.intl_countries]; const value = e.target.value ? Number(e.target.value) : null; rows[index] = { ...country, shipping_pkr: value, enabled: value !== null && country.enabled }; setData({ ...data, intl_countries: rows }); }} />
            <Input label="Delivery estimate text" type="text" maxLength={30} value={country.delivery_days_text} onChange={(e) => { const rows = [...data.intl_countries]; rows[index] = { ...country, delivery_days_text: e.target.value }; setData({ ...data, intl_countries: rows }); }} />
            <Input label="Note" type="text" maxLength={120} value={country.note} onChange={(e) => { const rows = [...data.intl_countries]; rows[index] = { ...country, note: e.target.value }; setData({ ...data, intl_countries: rows }); }} />
          </div>)}
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="font-medium text-slate-900">Gifting</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Toggle label="Enable gift option and page" checked={data.gift_enabled} onChange={(checked) => setData({ ...data, gift_enabled: checked })} />
            <Input label="Gift packaging price (PKR, optional)" type="number" min={1} max={1000000} value={data.gift_wrap_price_pkr ?? ""} onChange={(e) => setData({ ...data, gift_wrap_price_pkr: e.target.value ? Number(e.target.value) : null })} />
            <Toggle label="Gift message card included" checked={data.gift_includes_card} onChange={(checked) => setData({ ...data, gift_includes_card: checked })} />
            <Toggle label="Gift bag included" checked={data.gift_includes_bag} onChange={(checked) => setData({ ...data, gift_includes_bag: checked })} />
          </div>
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

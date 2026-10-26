import { requireAdmin } from "@/lib/auth/require-admin";
import { SettingsForm } from "./settings-form";
import type { SettingsFormData } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase.from("jf_settings").select("key,value");

  const settingsMap: Record<string, unknown> = {};
  for (const row of rows ?? []) {
    settingsMap[row.key] = row.value;
  }

  const parseString = (val: unknown): string => {
    if (typeof val === "string") {
      try {
        const decoded = JSON.parse(val);
        return typeof decoded === "string" ? decoded : val;
      } catch {
        return val;
      }
    }
    return "";
  };

  const parseHeroScenes = (val: unknown): SettingsFormData["hero_scenes"] => {
    if (!val) return [];
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.url === "string")
        .map((item) => ({
          url: item.url,
          accent: typeof item.accent === "string" ? item.accent : "#C9A66B",
          alt: typeof item.alt === "string" ? item.alt : "",
        }));
    } catch {
      return [];
    }
  };

  const parseSiteLogo = (val: unknown): SettingsFormData["site_logo"] => {
    if (!val) return null;
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      if (parsed && typeof parsed === "object" && typeof parsed.url === "string") {
        return {
          url: parsed.url,
          alt: typeof parsed.alt === "string" ? parsed.alt : "Jun.fragrance",
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const initialData: SettingsFormData = {
    whatsapp_number: parseString(settingsMap.whatsapp_number),
    social_instagram: parseString(settingsMap.social_instagram),
    social_tiktok: parseString(settingsMap.social_tiktok),
    social_facebook: parseString(settingsMap.social_facebook),
    social_youtube: parseString(settingsMap.social_youtube),
    google_site_verification: parseString(settingsMap.google_site_verification),
    bing_site_verification: parseString(settingsMap.bing_site_verification),
    business_city: parseString(settingsMap.business_city),
    business_address: parseString(settingsMap.business_address),
    business_phone_display: parseString(settingsMap.business_phone_display),
    hero_scenes: parseHeroScenes(settingsMap.hero_scenes),
    site_logo: parseSiteLogo(settingsMap.site_logo),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-slate-900">
          Store Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage contact info, social links, search engine verification, business address, and hero scenes.
        </p>
      </div>

      <SettingsForm initialData={initialData} />
    </div>
  );
}
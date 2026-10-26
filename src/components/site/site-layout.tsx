import { getPublicSettings, parseSiteLogo } from "@/lib/site/public-data";
import { socialUrl, whatsappNumber as getWhatsappNumber } from "@/lib/site/whatsapp";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ScrollEnhancer } from "./scroll-enhancer";
import { FloatingWhatsApp } from "./floating-whatsapp";

export async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const rawSettings = await getPublicSettings();
  const settings = Object.fromEntries(Object.entries(rawSettings).map(([key, value]) => [key, key.startsWith("social_") ? socialUrl(value) ?? undefined : value]));
  const number = getWhatsappNumber(settings);
  const siteLogo = parseSiteLogo(rawSettings.site_logo);
  return <><ScrollEnhancer /><SiteHeader siteLogo={siteLogo} whatsappNumber={number} /><main>{children}</main><SiteFooter settings={settings} siteLogo={siteLogo} whatsappNumber={number} /><FloatingWhatsApp whatsappNumber={number} /></>;
}
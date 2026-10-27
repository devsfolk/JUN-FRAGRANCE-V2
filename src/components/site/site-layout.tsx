import { getPublicSettings, parseSiteLogo, parseLogoShowText } from "@/lib/site/public-data";
import { socialUrl, whatsappNumber as getWhatsappNumber } from "@/lib/site/whatsapp";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ScrollEnhancer } from "./scroll-enhancer";
import { FloatingWhatsApp } from "./floating-whatsapp";
import { CartDrawerRoot } from "./cart-drawer-root";

export async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const rawSettings = await getPublicSettings();
  const settings = Object.fromEntries(Object.entries(rawSettings).map(([key, value]) => [key, key.startsWith("social_") ? socialUrl(value) ?? undefined : value]));
  const number = getWhatsappNumber(settings);
  const siteLogo = parseSiteLogo(rawSettings.site_logo);
  const logoShowText = parseLogoShowText(rawSettings.logo_show_text);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  return <><ScrollEnhancer /><SiteHeader logoShowText={logoShowText} siteLogo={siteLogo} whatsappNumber={number} /><main>{children}</main><SiteFooter logoShowText={logoShowText} settings={settings} siteLogo={siteLogo} whatsappNumber={number} /><FloatingWhatsApp whatsappNumber={number} /><CartDrawerRoot siteUrl={siteUrl} whatsappNumber={number} /></>;
}
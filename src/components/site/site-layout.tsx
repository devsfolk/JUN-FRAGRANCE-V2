import { getPublicSettings, parseSiteLogo, parseLogoShowText, parseBundleSettings } from "@/lib/site/public-data";
import { socialUrl, whatsappNumber as getWhatsappNumber } from "@/lib/site/whatsapp";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ScrollEnhancer } from "./scroll-enhancer";
import { FloatingWhatsApp } from "./floating-whatsapp";
import { CartDrawerRoot } from "./cart-drawer-root";
import { IntlProvider, type IntlCountry } from "./intl-provider";

export async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const rawSettings = await getPublicSettings();
  const settings = Object.fromEntries(Object.entries(rawSettings).map(([key, value]) => [key, key.startsWith("social_") ? socialUrl(value) ?? undefined : value]));
  const number = getWhatsappNumber(settings);
  const siteLogo = parseSiteLogo(rawSettings.site_logo);
  const logoShowText = parseLogoShowText(rawSettings.logo_show_text);
  const bundleSettings = parseBundleSettings(rawSettings);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://junfragrance.com";
  let countries: IntlCountry[] = [];
  try { countries = rawSettings.intl_countries ? JSON.parse(rawSettings.intl_countries) as IntlCountry[] : []; } catch { countries = []; }
  const intlEnabled = rawSettings.intl_enabled === "true" || rawSettings.intl_enabled === "1";
  const giftEnabled = rawSettings.gift_enabled !== "false" && rawSettings.gift_enabled !== "0";
  const giftWrapPrice = rawSettings.gift_wrap_price_pkr ? Number(rawSettings.gift_wrap_price_pkr) || null : null;
  const giftIncludesCard = rawSettings.gift_includes_card === "true" || rawSettings.gift_includes_card === "1";
  const giftIncludesBag = rawSettings.gift_includes_bag === "true" || rawSettings.gift_includes_bag === "1";
  return (
    <IntlProvider enabled={intlEnabled} countries={countries}>
      <ScrollEnhancer />
      <SiteHeader
        bundleEnabled={bundleSettings.enabled}
        giftsEnabled={giftEnabled}
        logoShowText={logoShowText}
        siteLogo={siteLogo}
        whatsappNumber={number}
      />
      <main>{children}</main>
      <SiteFooter
        bundleEnabled={bundleSettings.enabled}
        giftsEnabled={giftEnabled}
        logoShowText={logoShowText}
        settings={settings}
        siteLogo={siteLogo}
        whatsappNumber={number}
      />
      <FloatingWhatsApp whatsappNumber={number} />
      <CartDrawerRoot
        bundleEnabled={bundleSettings.enabled}
        bundlePrice={bundleSettings.price}
        giftEnabled={giftEnabled}
        giftWrapPrice={giftWrapPrice}
        giftIncludesCard={giftIncludesCard}
        giftIncludesBag={giftIncludesBag}
        siteUrl={siteUrl}
        whatsappNumber={number}
      />
    </IntlProvider>
  );
}

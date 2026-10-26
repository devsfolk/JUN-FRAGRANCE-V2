import { HeroSpotlight } from "./hero-spotlight";
import { getFeaturedHeroProducts, getPublicSettings } from "@/lib/site/public-data";
import { getHeroScenes } from "@/lib/site/hero-scenes";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export async function HeroSection() {
  const [products, settings] = await Promise.all([
    getFeaturedHeroProducts(),
    getPublicSettings(),
  ]);

  const scenes = getHeroScenes(settings.hero_scenes);
  const number = extractWhatsappNumber(settings);

  return (
    <HeroSpotlight
      scenes={scenes}
      products={products}
      whatsappNumber={number}
    />
  );
}

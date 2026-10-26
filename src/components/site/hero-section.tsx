import { HeroSpotlight } from "./hero-spotlight";
import { getFeaturedHeroProducts, getPublicSettings } from "@/lib/site/public-data";
import { getHeroScenes } from "@/lib/site/hero-scenes";
import { whatsappNumber as extractWhatsappNumber } from "@/lib/site/whatsapp";

export async function HeroSection() {
  const [scenes, products, settings] = await Promise.all([
    Promise.resolve(getHeroScenes()),
    getFeaturedHeroProducts(),
    getPublicSettings(),
  ]);

  const number = extractWhatsappNumber(settings);

  return (
    <HeroSpotlight
      scenes={scenes}
      products={products}
      whatsappNumber={number}
    />
  );
}

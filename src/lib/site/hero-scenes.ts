// Add a new photo to public/hero/ and add one line here.

export interface HeroScene {
  src: string;
  alt: string;
  accent: string;
  objectPosition: string;
}

export const HERO_SCENES: HeroScene[] = [
  {
    src: "/hero/scene-1.jpg",
    alt: "Jun.fragrance perfume scene",
    accent: "#C9A66B",
    objectPosition: "center center",
  },
  {
    src: "/hero/scene-2.jpeg",
    alt: "Jun.fragrance perfume scene",
    accent: "#D9502B",
    objectPosition: "center center",
  },
  {
    src: "/hero/scene-3.jpeg",
    alt: "Jun.fragrance perfume scene",
    accent: "#4F8FBF",
    objectPosition: "center center",
  },
];

export function parseHeroScenesSetting(raw: string | undefined): HeroScene[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: HeroScene[] = [];
    for (const item of parsed) {
      if (item && typeof item === "object" && typeof item.url === "string" && item.url.startsWith("http")) {
        valid.push({
          src: item.url,
          alt: typeof item.alt === "string" && item.alt.trim() ? item.alt.trim() : "Jun.fragrance perfume scene",
          accent: typeof item.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(item.accent) ? item.accent : "#C9A66B",
          objectPosition: "center center",
        });
      }
    }
    return valid;
  } catch {
    return [];
  }
}

export function getHeroScenes(heroScenesSetting?: string): HeroScene[] {
  const dynamic = parseHeroScenesSetting(heroScenesSetting);
  if (dynamic.length > 0) {
    return dynamic;
  }
  return HERO_SCENES;
}

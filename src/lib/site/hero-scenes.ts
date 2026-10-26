// Add a new photo to public/hero/ and add one line here.

export interface HeroScene {
  src: string;
  alt: string;
  accent: string;
  objectPosition: string;
}

export const HERO_SCENES: HeroScene[] = [
  {
    src: "/hero/79d2bac5-3d04-4fd5-9d5d-d884081c1941.jfif",
    alt: "Jun.fragrance perfume scene",
    accent: "#C9A66B",
    objectPosition: "center center",
  },
  {
    src: "/hero/mainimage.jpeg",
    alt: "Jun.fragrance perfume scene",
    accent: "#D9502B",
    objectPosition: "center center",
  },
  {
    src: "/hero/WhatsApp Image 2026-10-26 at 4.15.36 AM.jpeg",
    alt: "Jun.fragrance perfume scene",
    accent: "#4F8FBF",
    objectPosition: "center center",
  },
];

export function getHeroScenes(): HeroScene[] {
  return HERO_SCENES;
}

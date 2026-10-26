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

export function getHeroScenes(): HeroScene[] {
  return HERO_SCENES;
}

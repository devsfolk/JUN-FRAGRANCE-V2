import fs from "node:fs";
import path from "node:path";

export interface HeroScene {
  src: string;
  alt: string;
  accent: string;
  objectPosition: string;
}

const DEFAULT_ACCENTS = ["#C9A66B", "#D9502B", "#4F8FBF"];
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function getHeroScenes(): HeroScene[] {
  const heroDir = path.join(process.cwd(), "public", "hero");

  if (!fs.existsSync(heroDir)) {
    return [];
  }

  try {
    const files = fs
      .readdirSync(heroDir)
      .filter((file) => ALLOWED_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    return files.map((file, idx) => ({
      src: `/hero/${file}`,
      alt: "Jun.fragrance perfume scene",
      accent: DEFAULT_ACCENTS[idx % DEFAULT_ACCENTS.length],
      objectPosition: "center center",
    }));
  } catch {
    return [];
  }
}

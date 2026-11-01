import type { FinderProduct } from "@/lib/site/public-data";
import type { ScentFamily, ScentOccasion, ScentSeason, ScentStrength } from "@/lib/site/scent-profile";

export type FinderAnswers = {
  gender: "men" | "women" | "unisex";
  occasion: ScentOccasion;
  city: string;
  weather: "mild" | "hot-dry" | "hot-humid" | "cold";
  sweat: "low" | "medium" | "high";
  day: "ac" | "mixed" | "outdoors";
  styles: ScentFamily[];
  strength: ScentStrength;
};

export type FinderMatch = { product: FinderProduct; score: number; reason: string };

export function scoreFinderProducts(products: FinderProduct[], answers: FinderAnswers): FinderMatch[] {
  return products.map((product) => {
    const profile = product.scent_profile;
    const familyMatches = answers.styles.filter((family) => profile.families.includes(family));
    const strengthMatch = profile.strength === answers.strength;
    const occasionMatch = profile.occasions.includes(answers.occasion);
    const season = answers.weather === "cold" ? "winter" : answers.weather.startsWith("hot") ? "summer" : null;
    const seasonMatch = Boolean(season && profile.seasons.includes(season as ScentSeason));
    const genderMatch = product.gender === "unisex" || answers.gender === "unisex" || product.gender === answers.gender;
    const heatMatch = answers.weather.startsWith("hot") && profile.heat_ok;
    const score = familyMatches.length * 3 + Number(strengthMatch) * 2 + Number(occasionMatch) * 2 + Number(seasonMatch) + Number(heatMatch) + Number(genderMatch);
    const reasons = [];
    if (familyMatches[0]) reasons.push(`matches your ${familyMatches[0]} style`);
    if (strengthMatch) reasons.push(`${profile.strength} strength`);
    if (occasionMatch) reasons.push(`fits ${answers.occasion}`);
    if (heatMatch) reasons.push(`marked for hot or humid weather`);
    return { product, score, reason: reasons.length ? reasons.join(" and ") : "matches parts of your selected brief" };
  }).sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title));
}

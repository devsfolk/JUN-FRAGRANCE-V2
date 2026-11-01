export const scentFamilies = ["fresh", "citrus", "aquatic", "woody", "oud", "floral", "sweet", "spicy", "musky", "fruity"] as const;
export const scentStrengths = ["soft", "moderate", "strong"] as const;
export const scentOccasions = ["day", "office", "evening", "wedding"] as const;
export const scentSeasons = ["summer", "winter", "all year"] as const;

export type ScentFamily = (typeof scentFamilies)[number];
export type ScentStrength = (typeof scentStrengths)[number];
export type ScentOccasion = (typeof scentOccasions)[number];
export type ScentSeason = (typeof scentSeasons)[number];
export type ScentProfile = {
  families: ScentFamily[];
  strength: ScentStrength | null;
  occasions: ScentOccasion[];
  seasons: ScentSeason[];
  heat_ok: boolean;
};

export const emptyScentProfile = (): ScentProfile => ({ families: [], strength: null, occasions: [], seasons: [], heat_ok: false });

export function hasScentProfileData(profile: ScentProfile | null | undefined): profile is ScentProfile {
  return Boolean(profile && (profile.families.length || profile.strength || profile.occasions.length || profile.seasons.length || profile.heat_ok));
}

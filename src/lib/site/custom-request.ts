export const customForOptions = ["Men", "Women", "Unisex"] as const;
export const customOccasions = ["Daily", "Office or university", "Wedding or festive", "Evening out", "A gift"] as const;
export const customCityOptions = ["Karachi", "Lahore", "Islamabad or Rawalpindi", "Peshawar", "Quetta", "Faisalabad", "Multan", "Other"] as const;
export const customWeatherOptions = ["Mild", "Hot and dry", "Hot and humid", "Cold"] as const;
export const customSweatOptions = ["Low", "Medium", "High"] as const;
export const customDayOptions = ["Mostly in AC", "Mixed", "Mostly outdoors"] as const;
export const customSeasonOptions = ["Summer", "Winter", "All year"] as const;
export const customWearOptions = ["Office or AC", "Outdoors or commute", "Wedding or event", "Evening out", "Casual daily"] as const;
export const customStyleOptions = ["Fresh and citrus", "Aquatic", "Woody", "Oud", "Floral", "Sweet and vanilla", "Spicy", "Musky and clean", "Fruity"] as const;
export const customStrengthOptions = ["Soft", "Moderate", "Strong"] as const;
export const customAlcoholOptions = ["Standard", "Low alcohol, more oil", "Alcohol-free, oil based"] as const;

export type CustomAnswers = {
  for: (typeof customForOptions)[number];
  occasion: (typeof customOccasions)[number];
  city: (typeof customCityOptions)[number];
  cityOther: string;
  weather: (typeof customWeatherOptions)[number];
  sweat: (typeof customSweatOptions)[number];
  day: (typeof customDayOptions)[number];
  season: (typeof customSeasonOptions)[number];
  wear: string[];
  styles: string[];
  avoid: string[];
  strength: (typeof customStrengthOptions)[number];
  oils: string[];
  alcohol: (typeof customAlcoholOptions)[number];
  reference: string;
  bottleName: string;
  sensitivities: string;
  notes: string;
};

export const blankCustomAnswers: CustomAnswers = {
  for: "Unisex", occasion: "Daily", city: "Karachi", cityOther: "", weather: "Mild", sweat: "Low", day: "Mixed", season: "All year",
  wear: [], styles: [], avoid: [], strength: "Moderate", oils: [], alcohol: "Standard", reference: "", bottleName: "", sensitivities: "", notes: "",
};

export function sanitizeCustomText(value: unknown, maxLength: number) {
  return (typeof value === "string" ? value : "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength).trim();
}

function enumValue<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]): T[number] {
  return typeof value === "string" && options.includes(value) ? value as T[number] : fallback;
}
function selected(value: unknown, allowed: readonly string[], max: number) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.includes(item)))].slice(0, max) : [];
}

export function sanitizeCustomAnswers(value: unknown, noteOptions: string[], lowAlcoholEnabled: boolean, alcoholFreeEnabled: boolean): CustomAnswers {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const enabledAlcohol = [customAlcoholOptions[0], ...(lowAlcoholEnabled ? [customAlcoholOptions[1]] : []), ...(alcoholFreeEnabled ? [customAlcoholOptions[2]] : [])];
  return {
    for: enumValue(input.for, customForOptions, blankCustomAnswers.for),
    occasion: enumValue(input.occasion, customOccasions, blankCustomAnswers.occasion),
    city: enumValue(input.city, customCityOptions, blankCustomAnswers.city),
    cityOther: sanitizeCustomText(input.cityOther, 40),
    weather: enumValue(input.weather, customWeatherOptions, blankCustomAnswers.weather),
    sweat: enumValue(input.sweat, customSweatOptions, blankCustomAnswers.sweat),
    day: enumValue(input.day, customDayOptions, blankCustomAnswers.day),
    season: enumValue(input.season, customSeasonOptions, blankCustomAnswers.season),
    wear: selected(input.wear, customWearOptions, 2),
    styles: selected(input.styles, customStyleOptions, 3),
    avoid: selected(input.avoid, customStyleOptions, 3),
    strength: enumValue(input.strength, customStrengthOptions, blankCustomAnswers.strength),
    oils: selected(input.oils, noteOptions, 5),
    alcohol: enumValue(input.alcohol, enabledAlcohol, "Standard"),
    reference: sanitizeCustomText(input.reference, 120),
    bottleName: sanitizeCustomText(input.bottleName, 20),
    sensitivities: sanitizeCustomText(input.sensitivities, 80),
    notes: sanitizeCustomText(input.notes, 120),
  };
}

export function buildCustomWhatsAppMessage(answers: CustomAnswers, noteOptions: string[], lowAlcoholEnabled: boolean, alcoholFreeEnabled: boolean) {
  const safe = sanitizeCustomAnswers(answers, noteOptions, lowAlcoholEnabled, alcoholFreeEnabled);
  const city = safe.city === "Other" ? safe.cityOther || "Other" : safe.city;
  return [
    "Assalam o Alaikum! I would like a custom fragrance.",
    "",
    `For: ${safe.for} | Occasion: ${safe.occasion}`,
    `City: ${city} | Weather: ${safe.weather} | Sweat: ${safe.sweat} | Day: ${safe.day}`,
    `Scent styles: ${safe.styles.join(", ") || "not specified"} | Please avoid: ${safe.avoid.join(", ") || "not specified"}`,
    `Strength: ${safe.strength}`,
    `Oils and notes wanted: ${safe.oils.join(", ") || "not specified"}`,
    `Alcohol: ${safe.alcohol}`,
    `Wear: ${safe.wear.join(", ") || "not specified"} | Season: ${safe.season}`,
    `Should smell like: ${safe.reference || "not specified"}`,
    `Sensitivities: ${safe.sensitivities || "none"}`,
    `Bottle name: ${safe.bottleName || "none"}`,
    `Notes: ${safe.notes || "none"}`,
    "Size: 50 ml",
    "",
    "Name:",
    "Address:",
  ].join("\n").slice(0, 1799);
}

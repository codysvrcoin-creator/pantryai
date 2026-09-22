import type { MealType, PlannedIngredient } from "@/lib/types";

// A small, hand-picked palette (in the app's own colors + a few friendly
// extras) that every "vibe" tag gets deterministically assigned from, so the
// same vibe always looks the same and cards feel varied at a glance.
const VIBE_PALETTE = [
  { bg: "#FFE9D6", text: "#B8571F" }, // citrus
  { bg: "#FFD9E4", text: "#A83E5C" }, // berry / pink
  { bg: "#D6EDDF", text: "#236449" }, // basil
  { bg: "#D9EEF2", text: "#1F6B7A" }, // teal
  { bg: "#E7E0F5", text: "#5B4A96" }, // lavender
  { bg: "#FFF3C4", text: "#8A6D1A" }, // gold
  { bg: "#DCEAFB", text: "#2C5C99" }, // sky
  { bg: "#F1E4D8", text: "#6B4A2F" }, // sand
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getVibeStyle(vibe: string) {
  const palette = VIBE_PALETTE[hashString(vibe || "Balanced") % VIBE_PALETTE.length];
  return palette;
}

// Thumbnail gradients per meal type — used as the background behind the
// meal's emoji on cards, so a recipe always has a warm, food-ish visual
// even without a real photo (keeps the app fully offline-capable as a PWA).
const THUMB_GRADIENTS: Record<MealType, string> = {
  breakfast: "linear-gradient(135deg, #FFE3B8 0%, #FFB16B 100%)",
  lunch: "linear-gradient(135deg, #C8EBD6 0%, #6CC79A 100%)",
  dinner: "linear-gradient(135deg, #D7CFF0 0%, #9C86D9 100%)",
  snack: "linear-gradient(135deg, #FFD3DC 0%, #FF93A8 100%)",
};

const KEYWORD_EMOJI: [RegExp, string][] = [
  [/smooth?ie/i, "🥤"],
  [/bowl/i, "🥣"],
  [/curry/i, "🍛"],
  [/pasta|noodle|spaghetti/i, "🍝"],
  [/salad/i, "🥗"],
  [/soup|stew/i, "🍲"],
  [/wrap|burrito|taco/i, "🌯"],
  [/pizza/i, "🍕"],
  [/stir.?fry/i, "🥘"],
  [/burger|patty/i, "🍔"],
  [/toast|sandwich/i, "🥪"],
  [/pancake|waffle/i, "🥞"],
  [/tofu/i, "🍱"],
  [/rice/i, "🍚"],
  [/chili/i, "🌶️"],
  [/sushi/i, "🍣"],
  [/oat/i, "🥣"],
];

const MEAL_TYPE_FALLBACK_EMOJI: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

export function getMealThumbnail(recipeName: string, mealType: MealType) {
  const match = KEYWORD_EMOJI.find(([re]) => re.test(recipeName));
  const emoji = match ? match[1] : MEAL_TYPE_FALLBACK_EMOJI[mealType];
  const gradient = THUMB_GRADIENTS[mealType] ?? THUMB_GRADIENTS.dinner;
  return { emoji, gradient };
}

export function totalServings(ingredients: PlannedIngredient[], people: number) {
  return Math.max(1, people);
}

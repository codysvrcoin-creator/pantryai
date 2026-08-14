// -----------------------------------------------------------------------
// All of the app's nutrition arithmetic lives here, and ONLY here.
// Fixed rule: 1g protein = 4 kcal · 1g carbs = 4 kcal · 1g fat = 9 kcal.
// The AI may estimate the nutritional composition of ingredients (a
// factual data point, just like it estimates prices), but it never decides
// the total calories: that's always derived mathematically from macros here.
// -----------------------------------------------------------------------

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARBS = 4;
export const KCAL_PER_G_FAT = 9;

/** Calories implied by a given set of macros, rounded to the nearest integer. */
export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return Math.round(
    proteinG * KCAL_PER_G_PROTEIN + carbsG * KCAL_PER_G_CARBS + fatG * KCAL_PER_G_FAT
  );
}

/**
 * Are these macros and these calories mathematically compatible, within a
 * reasonable margin? (targets are rarely "perfect" round numbers, so we use
 * a tolerance instead of requiring an exact match).
 */
export function isNutritionConsistent(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  tolerancePct: number = 0.05
): boolean {
  const implied = caloriesFromMacros(proteinG, carbsG, fatG);
  if (implied === 0) return calories === 0;
  return Math.abs(implied - calories) / implied <= tolerancePct;
}

/** Adjusts carbs so the target calories match exactly, keeping protein and fat fixed. */
export function resolveByAdjustingCarbs(
  calories: number,
  proteinG: number,
  fatG: number
): number {
  const remaining = calories - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT;
  return Math.max(0, Math.round(remaining / KCAL_PER_G_CARBS));
}

export interface IngredientNutrition {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Sums the nutrition of every ingredient in a meal and DERIVES the final
 * calories from that macro sum (never from a calorie number suggested
 * directly by the AI).
 */
export function computeMealNutrition(ingredients: IngredientNutrition[]): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  const proteinG = +ingredients.reduce((sum, i) => sum + i.proteinG, 0).toFixed(1);
  const carbsG = +ingredients.reduce((sum, i) => sum + i.carbsG, 0).toFixed(1);
  const fatG = +ingredients.reduce((sum, i) => sum + i.fatG, 0).toFixed(1);
  return {
    proteinG,
    carbsG,
    fatG,
    calories: caloriesFromMacros(proteinG, carbsG, fatG),
  };
}

/** Is the "actual" total (e.g. for a day already cooked) reasonably close to the target? */
export function isWithinTolerance(actual: number, target: number, tolerancePct: number = 0.12): boolean {
  if (target === 0) return actual === 0;
  return Math.abs(actual - target) / target <= tolerancePct;
}

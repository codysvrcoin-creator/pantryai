import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const plannedIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  pantryCategory: z.string().default("other"),
  // Nutrition contributed by THIS ingredient at the stated quantity (not per
  // 100g): the AI estimates this factual data, but the app is always the one
  // that SUMS it and computes the final calories (4/4/9 rule), never the AI.
  kcal: z.number().nonnegative().default(0),
  proteinG: z.number().nonnegative().default(0),
  carbsG: z.number().nonnegative().default(0),
  fatG: z.number().nonnegative().default(0),
});

export const plannedStepSchema = z.object({
  text: z.string().min(1),
  /** Wait/cook minutes for this specific step (boil, bake, reduce...), or null if it's an active step with no wait. */
  timerMinutes: z.number().positive().nullable().default(null),
});

export const plannedMealSchema = z.object({
  mealType: mealTypeSchema,
  recipeName: z.string().min(1),
  instructions: z.string().default(""),
  steps: z.array(plannedStepSchema).min(1),
  utensils: z.array(z.string()).default([]),
  ingredients: z.array(plannedIngredientSchema).min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  prepMinutes: z.number().nonnegative(),
  cookMinutes: z.number().nonnegative(),
  estimatedCost: z.number().nonnegative(),
});

export const plannedDaySchema = z.object({
  date: z.string().min(1),
  meals: z.array(plannedMealSchema),
});

export const weekPlanResponseSchema = z.object({
  days: z.array(plannedDaySchema).min(1),
  summary: z.string().default(""),
});

export const singleMealResponseSchema = plannedMealSchema;

export const budgetOptimizationResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      originalName: z.string(),
      replacementName: z.string(),
      reason: z.string(),
      estimatedNewPrice: z.number().nonnegative(),
    })
  ),
});

export const groceryAddItemResponseSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default("u"),
  category: z.string().default("other"),
});

export const groceryAddResponseSchema = z.object({
  items: z.array(groceryAddItemResponseSchema).min(1),
});

export type GroceryAddResponse = z.infer<typeof groceryAddResponseSchema>;

export const quickPantryItemResponseSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default("u"),
  category: z.string().default("other"),
  location: z.enum(["fridge", "pantry", "freezer"]).default("pantry"),
});

export const quickPantryResponseSchema = z.object({
  items: z.array(quickPantryItemResponseSchema).min(1),
});

export type QuickPantryResponse = z.infer<typeof quickPantryResponseSchema>;

export const receiptItemResponseSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit: z.string().default("u"),
  price: z.number().nonnegative().default(0),
  category: z.string().default("other"),
  location: z.enum(["fridge", "pantry", "freezer"]).default("pantry"),
});

export const receiptScanResponseSchema = z.object({
  storeName: z.string().nullable().default(null),
  purchaseDate: z.string().nullable().default(null),
  items: z.array(receiptItemResponseSchema).default([]),
});

export type ReceiptItemAI = z.infer<typeof receiptItemResponseSchema>;
export type ReceiptScanResponse = z.infer<typeof receiptScanResponseSchema>;

export type PlannedIngredient = z.infer<typeof plannedIngredientSchema>;
export type PlannedMealAI = z.infer<typeof plannedMealSchema>;
export type PlannedDayAI = z.infer<typeof plannedDaySchema>;
export type WeekPlanResponse = z.infer<typeof weekPlanResponseSchema>;
export type BudgetOptimizationResponse = z.infer<typeof budgetOptimizationResponseSchema>;

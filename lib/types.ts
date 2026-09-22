export type Location = "fridge" | "pantry" | "freezer";

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: Location;
  purchase_date: string | null;
  expiration_date: string | null;
  is_empty: boolean;
  created_at: string;
  updated_at: string;
}

export interface PantryTransaction {
  id: string;
  pantry_item_id: string;
  type: "add" | "consume" | "discard" | "adjust";
  quantity: number;
  unit: string;
  note?: string | null;
  created_at: string;
}

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Preferences {
  people: number;
  weekly_budget: number;
  currency: string;
  /** How many days per week the user actively cooks; the rest are meal-prepped days off. */
  cook_days_per_week: number;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
  pantry_category: string;
  optional: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  servings_base: number;
  instructions: string | null;
  prep_minutes: number;
  cook_minutes: number;
  tags: string[];
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  estimated_cost: number | null;
  ingredients?: RecipeIngredient[];
  /** "import" = saved from a social media / pasted recipe; "manual" = created directly. */
  source: "manual" | "import";
  source_url: string | null;
  /** Full steps and utensils, kept client-side for display (not modeled as separate DB columns). */
  steps: { text: string; timerMinutes: number | null }[];
  utensils: string[];
  was_adapted: boolean;
  adaptation_note: string | null;
  created_at: string;
}

export interface GroceryListItem {
  id: string;
  grocery_list_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_price: number;
  is_checked: boolean;
  source: "manual" | "recipe" | "restock";
}

export const PANTRY_CATEGORIES = [
  "fruits and vegetables",
  "meat and fish",
  "dairy",
  "grains and pasta",
  "canned goods",
  "frozen",
  "condiments",
  "beverages",
  "other",
] as const;

// -----------------------------------------------------------------------
// Part 2: Weekly plan and grocery list
// -----------------------------------------------------------------------

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface PlannedIngredient {
  name: string;
  quantity: number;
  unit: string;
  pantryCategory: string;
  /** Nutrition contributed by THIS ingredient at the stated quantity (not per 100g). */
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface PlannedStep {
  text: string;
  /** Wait/cook minutes for this step (boil, bake, reduce...), or null if it doesn't require waiting. */
  timerMinutes: number | null;
}

export interface PlannedMeal {
  id: string;
  mealType: MealType;
  recipeName: string;
  /** Short 1-2 sentence summary (preview shown on cards). */
  instructions: string;
  /** Detailed, actionable steps in order, with quantities and a timer when applicable. */
  steps: PlannedStep[];
  /** Utensils needed for the whole recipe (pot, pan, oven...). */
  utensils: string[];
  ingredients: PlannedIngredient[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  prepMinutes: number;
  cookMinutes: number;
  estimatedCost: number;
  /** True if this is a reheated meal-prep batch from an earlier cook day (part of a "day off" from cooking). */
  isLeftover: boolean;
}

export interface PlannedDay {
  date: string;
  meals: PlannedMeal[];
}

export interface WeekPlan {
  weekStartDate: string;
  days: PlannedDay[];
  summary: string;
  generatedAt: string;
  userPrompt: string;
}

// -----------------------------------------------------------------------
// Part 3: Receipt scanner (OCR), Cooking Mode, and Sync
// -----------------------------------------------------------------------

export interface ScannedReceiptItem {
  /** Temporary id used only for the validation UI (doesn't exist in the DB until confirmed). */
  tempId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  location: Location;
  include: boolean;
}

export interface ScannedReceipt {
  storeName: string | null;
  purchaseDate: string | null;
  items: ScannedReceiptItem[];
}

export interface Receipt {
  id: string;
  store_name: string | null;
  purchase_date: string;
  total_amount: number;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  requiredQuantity: number;
  requiredUnit: string;
  /** How much of this product is already in the pantry (same unit as requiredUnit). */
  alreadyHaveQuantity: number;
  alreadyHaveUnit: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  purchaseLabel: string;
  estimatedPrice: number;
  /** false if the price comes from price memory (a previous real purchase); true if it's a generic estimate. */
  priceIsEstimated: boolean;
  isChecked: boolean;
  haveEnough: boolean;
  usedInMeals: number;
  source: "plan" | "manual" | "ai";
}

// -----------------------------------------------------------------------
// Part 4: Personal price memory (latest price paid per product)
// -----------------------------------------------------------------------

/** A SINGLE record per normalized product: only the LATEST known purchase, never a history. */
export interface PriceMemoryEntry {
  /** Normalized key (lowercase, no accents) used as the product identifier. */
  key: string;
  /** Human-readable name as shown in the app. */
  displayName: string;
  lastPrice: number;
  packageQuantity: number;
  packageUnit: string;
  /** $/kg, $/l, or $/unit, when it can be calculated. */
  pricePerBaseUnit: number | null;
  baseUnit: "g" | "ml" | "u";
  storeName: string | null;
  purchaseDate: string;
}

import type { PantryItem, WeekPlan, GroceryItem, PlannedIngredient, PriceMemoryEntry } from "@/lib/types";
import { toBaseUnit, roundToPurchasePack, resolvePriceForPurchase } from "@/lib/priceEstimates";
import { normalizeProductName } from "@/lib/productName";

function normalizeName(name: string): string {
  return normalizeProductName(name);
}

function displayFromBase(value: number, base: "g" | "ml" | "u"): { quantity: number; unit: string } {
  if (base === "g") {
    return value >= 1000
      ? { quantity: +(value / 1000).toFixed(2), unit: "kg" }
      : { quantity: Math.round(value), unit: "g" };
  }
  if (base === "ml") {
    return value >= 1000
      ? { quantity: +(value / 1000).toFixed(2), unit: "l" }
      : { quantity: Math.round(value), unit: "ml" };
  }
  return { quantity: +value.toFixed(2), unit: "u" };
}

function uid() {
  return crypto.randomUUID();
}

interface AggregatedIngredient {
  name: string;
  category: string;
  base: "g" | "ml" | "u";
  totalValue: number;
  mealsCount: number;
}

/** Sums every ingredient across every meal in the plan, grouped by name. */
function aggregateIngredients(weekPlan: WeekPlan): AggregatedIngredient[] {
  const map = new Map<string, AggregatedIngredient>();

  for (const day of weekPlan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients as PlannedIngredient[]) {
        const key = normalizeName(ing.name);
        const { value, base } = toBaseUnit(ing.quantity, ing.unit);
        const existing = map.get(key);
        if (existing) {
          existing.totalValue += value;
          existing.mealsCount += 1;
        } else {
          map.set(key, {
            name: ing.name,
            category: ing.pantryCategory || "other",
            base,
            totalValue: value,
            mealsCount: 1,
          });
        }
      }
    }
  }

  return Array.from(map.values());
}

/** How much of an ingredient we already have in the pantry (in the same base unit). */
function pantryAvailability(
  name: string,
  base: "g" | "ml" | "u",
  pantryItems: PantryItem[]
): number {
  const key = normalizeName(name);
  let total = 0;
  for (const item of pantryItems) {
    if (item.is_empty) continue;
    const itemKey = normalizeName(item.name);
    // Flexible match: exact name, or one contains the other.
    if (itemKey === key || itemKey.includes(key) || key.includes(itemKey)) {
      const { value, base: itemBase } = toBaseUnit(item.quantity, item.unit);
      if (itemBase === base) total += value;
    }
  }
  return total;
}

/**
 * Computes the deterministic grocery list: Required by the plan - Available
 * in the pantry = To buy. "Manual" products the user added by hand are kept
 * as-is (never recalculated).
 */
export function generateGroceryList(
  weekPlan: WeekPlan,
  pantryItems: PantryItem[],
  previousManualItems: GroceryItem[] = [],
  priceMemory: Record<string, PriceMemoryEntry> = {}
): GroceryItem[] {
  const aggregated = aggregateIngredients(weekPlan);

  const planItems: GroceryItem[] = aggregated.map((agg) => {
    const available = pantryAvailability(agg.name, agg.base, pantryItems);
    const remainingBase = Math.max(0, agg.totalValue - available);
    const haveEnough = remainingBase <= 0;

    const requiredDisplay = displayFromBase(agg.totalValue, agg.base);
    const alreadyHaveDisplay = displayFromBase(Math.min(available, agg.totalValue), agg.base);

    if (haveEnough) {
      return {
        id: uid(),
        name: agg.name,
        category: agg.category,
        requiredQuantity: requiredDisplay.quantity,
        requiredUnit: requiredDisplay.unit,
        alreadyHaveQuantity: alreadyHaveDisplay.quantity,
        alreadyHaveUnit: alreadyHaveDisplay.unit,
        purchaseQuantity: 0,
        purchaseUnit: requiredDisplay.unit,
        purchaseLabel: "Already have enough",
        estimatedPrice: 0,
        priceIsEstimated: false,
        isChecked: true,
        haveEnough: true,
        usedInMeals: agg.mealsCount,
        source: "plan",
      };
    }

    const remainingDisplay = displayFromBase(remainingBase, agg.base);
    const pack = roundToPurchasePack(remainingDisplay.quantity, remainingDisplay.unit);
    const memoryEntry = priceMemory[normalizeName(agg.name)];
    const resolved = resolvePriceForPurchase(agg.category, pack.quantity, pack.unit, memoryEntry);

    return {
      id: uid(),
      name: agg.name,
      category: agg.category,
      requiredQuantity: requiredDisplay.quantity,
      requiredUnit: requiredDisplay.unit,
      alreadyHaveQuantity: alreadyHaveDisplay.quantity,
      alreadyHaveUnit: alreadyHaveDisplay.unit,
      purchaseQuantity: pack.quantity,
      purchaseUnit: pack.unit,
      purchaseLabel: pack.label,
      estimatedPrice: resolved.price,
      priceIsEstimated: resolved.isEstimated,
      isChecked: false,
      haveEnough: false,
      usedInMeals: agg.mealsCount,
      source: "plan",
    };
  });

  return [...planItems, ...previousManualItems];
}

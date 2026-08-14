import type { PantryItem, PlannedIngredient } from "@/lib/types";
import { toBaseUnit } from "@/lib/priceEstimates";

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents: "café" -> "cafe"
}

function isNameMatch(pantryName: string, ingredientName: string): boolean {
  const a = normalizeName(pantryName);
  const b = normalizeName(ingredientName);
  return a === b || a.includes(b) || b.includes(a);
}

export interface DeductionResult {
  ingredientName: string;
  requestedQuantity: number;
  requestedUnit: string;
  deductedFromPantry: boolean;
  fullyCovered: boolean;
}

/**
 * Deducts a single ingredient from the pantry's list of products, in a
 * 100% deterministic way (no AI involved): looks for name matches,
 * starting with the ones closest to expiring, and subtracts the quantity
 * converted to the same base unit (g / ml / u). Returns the updated
 * pantry and a summary of what could be deducted.
 */
function deductOne(
  pantryItems: PantryItem[],
  ingredient: PlannedIngredient
): { items: PantryItem[]; result: DeductionResult } {
  const { value: neededBase, base: neededUnitBase } = toBaseUnit(
    ingredient.quantity,
    ingredient.unit
  );

  const candidateIds = pantryItems
    .filter((it) => !it.is_empty && isNameMatch(it.name, ingredient.name))
    .filter((it) => toBaseUnit(it.quantity, it.unit).base === neededUnitBase)
    .sort((a, b) => {
      if (!a.expiration_date) return 1;
      if (!b.expiration_date) return -1;
      return a.expiration_date.localeCompare(b.expiration_date);
    })
    .map((it) => it.id);

  let remaining = neededBase;
  let deductedAny = false;

  const nextItems = pantryItems.map((it) => {
    if (remaining <= 0 || !candidateIds.includes(it.id)) return it;

    const { value: availableBase, base } = toBaseUnit(it.quantity, it.unit);
    const take = Math.min(availableBase, remaining);
    if (take <= 0) return it;

    remaining -= take;
    deductedAny = true;

    // Convert the "take" (in base g/ml/u) back to the item's own unit.
    const perUnitFactor =
      base === "g" && it.unit.toLowerCase() === "kg"
        ? 1000
        : base === "ml" && it.unit.toLowerCase() === "l"
        ? 1000
        : 1;
    const takeInItemUnit = take / perUnitFactor;
    const nextQty = Math.max(0, +(it.quantity - takeInItemUnit).toFixed(3));

    return {
      ...it,
      quantity: nextQty,
      is_empty: nextQty <= 0,
      updated_at: new Date().toISOString(),
    };
  });

  return {
    items: nextItems,
    result: {
      ingredientName: ingredient.name,
      requestedQuantity: ingredient.quantity,
      requestedUnit: ingredient.unit,
      deductedFromPantry: deductedAny,
      fullyCovered: remaining <= 0,
    },
  };
}

export function deductIngredientsFromPantry(
  pantryItems: PantryItem[],
  ingredients: PlannedIngredient[]
): { items: PantryItem[]; results: DeductionResult[] } {
  let items = pantryItems;
  const results: DeductionResult[] = [];

  for (const ingredient of ingredients) {
    const { items: nextItems, result } = deductOne(items, ingredient);
    items = nextItems;
    results.push(result);
  }

  return { items, results };
}

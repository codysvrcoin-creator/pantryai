// -----------------------------------------------------------------------
// Rough average reference prices used to calculate the estimated cost of
// the shopping list in a 100% deterministic way.
// The AI never decides prices: it only provides ingredient quantities.
// -----------------------------------------------------------------------

import type { PriceMemoryEntry } from "@/lib/types";

interface PriceRule {
  perKg?: number;
  perUnit?: number;
}

export const PRICE_TABLE: Record<string, PriceRule> = {
  "fruits and vegetables": { perKg: 2.2, perUnit: 0.5 },
  "meat and fish": { perKg: 9.5, perUnit: 2 },
  dairy: { perKg: 5, perUnit: 1.1 },
  "grains and pasta": { perKg: 1.8, perUnit: 1 },
  "canned goods": { perKg: 4, perUnit: 1.4 },
  frozen: { perKg: 6, perUnit: 2 },
  condiments: { perKg: 5, perUnit: 1.5 },
  beverages: { perKg: 1.5, perUnit: 1.2 },
  other: { perKg: 3, perUnit: 1 },
};

/** Converts any known unit to grams/ml or to "units" so amounts can be compared/summed. */
export function toBaseUnit(quantity: number, unit: string): { value: number; base: "g" | "ml" | "u" } {
  const u = unit.toLowerCase();
  if (u === "kg") return { value: quantity * 1000, base: "g" };
  if (u === "g" || u === "gr") return { value: quantity, base: "g" };
  if (u === "l") return { value: quantity * 1000, base: "ml" };
  if (u === "ml") return { value: quantity, base: "ml" };
  // package, can, dozen, u, unit... are treated as countable units
  if (u === "dozen") return { value: quantity * 12, base: "u" };
  return { value: quantity, base: "u" };
}

export function estimatePrice(category: string, quantity: number, unit: string): number {
  const rule = PRICE_TABLE[category] ?? PRICE_TABLE["other"];
  const { value, base } = toBaseUnit(quantity, unit);

  if (base === "g" && rule.perKg) {
    return +((value / 1000) * rule.perKg).toFixed(2);
  }
  if (base === "ml" && rule.perKg) {
    // approximate liquids using the same price/kg as solids in the category
    return +((value / 1000) * rule.perKg).toFixed(2);
  }
  const perUnit = rule.perUnit ?? 1;
  return +(value * perUnit).toFixed(2);
}

/** Rounds a "required" quantity to the usual supermarket package size. */
export function roundToPurchasePack(
  quantity: number,
  unit: string
): { quantity: number; unit: string; label: string } {
  const u = unit.toLowerCase();

  if (u === "g" || u === "kg") {
    const grams = u === "kg" ? quantity * 1000 : quantity;
    if (grams <= 500) {
      const pack = grams <= 250 ? 250 : 500;
      return { quantity: pack, unit: "g", label: `1 x ${pack}g` };
    }
    const kg = Math.ceil(grams / 250) * 0.25;
    return { quantity: kg, unit: "kg", label: `1 x ${kg}kg` };
  }

  if (u === "ml" || u === "l") {
    const ml = u === "l" ? quantity * 1000 : quantity;
    if (ml <= 500) {
      const pack = ml <= 250 ? 250 : 500;
      return { quantity: pack, unit: "ml", label: `1 x ${pack}ml` };
    }
    const l = Math.ceil(ml / 500) * 0.5;
    return { quantity: l, unit: "l", label: `1 x ${l}l` };
  }

  if (u === "dozen") {
    const dozens = Math.max(1, Math.ceil(quantity / 12));
    return { quantity: dozens * 12, unit: "u", label: `${dozens} x dozen` };
  }

  // loose units (u, package, can...)
  const rounded = Math.max(1, Math.ceil(quantity));
  return { quantity: rounded, unit, label: `${rounded} x ${unit}` };
}

// -----------------------------------------------------------------------
// Personal price memory: normalized price-per-base-unit calculation
// ($/kg, $/l, or $/unit) and resolving which price to use (real vs
// estimated). 100% deterministic, the AI never decides the price.
// -----------------------------------------------------------------------

/** $/kg, $/l, or $/unit from a price paid for a specific quantity+unit. */
export function computePricePerBaseUnit(
  price: number,
  quantity: number,
  unit: string
): { pricePerBaseUnit: number | null; baseUnit: "g" | "ml" | "u" } {
  const { value, base } = toBaseUnit(quantity, unit);
  if (value <= 0) return { pricePerBaseUnit: null, baseUnit: base };
  if (base === "u") return { pricePerBaseUnit: +(price / value).toFixed(2), baseUnit: base };
  // g or ml: normalize to $/kg or $/l (per 1000 base units)
  return { pricePerBaseUnit: +((price / value) * 1000).toFixed(2), baseUnit: base };
}

export interface ResolvedPrice {
  price: number;
  isEstimated: boolean;
  /** Short label shown under the price, e.g. "Last price: Lidl" or "Estimated". */
  sourceLabel: string;
}

/**
 * Decides which price to use for a quantity to purchase: prioritizes the
 * last real price paid (price memory) if it exists and its base unit
 * matches; otherwise falls back to the estimated price table.
 */
export function resolvePriceForPurchase(
  category: string,
  purchaseQuantity: number,
  purchaseUnit: string,
  memoryEntry: PriceMemoryEntry | undefined
): ResolvedPrice {
  if (memoryEntry && memoryEntry.pricePerBaseUnit != null) {
    const { value, base } = toBaseUnit(purchaseQuantity, purchaseUnit);
    if (base === memoryEntry.baseUnit) {
      const factor = base === "u" ? value : value / 1000;
      return {
        price: +(memoryEntry.pricePerBaseUnit * factor).toFixed(2),
        isEstimated: false,
        sourceLabel: memoryEntry.storeName
          ? `Last price · ${memoryEntry.storeName}`
          : "Last price paid",
      };
    }
  }
  return {
    price: estimatePrice(category, purchaseQuantity, purchaseUnit),
    isEstimated: true,
    sourceLabel: "Estimated",
  };
}

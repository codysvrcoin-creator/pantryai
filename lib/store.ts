"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import type {
  PantryItem,
  Location,
  WeekPlan,
  PlannedMeal,
  PlannedIngredient,
  GroceryItem,
  ScannedReceiptItem,
  PriceMemoryEntry,
  Recipe,
} from "@/lib/types";
import { generateGroceryList } from "@/lib/groceryDiff";
import { estimatePrice, computePricePerBaseUnit, resolvePriceForPurchase, toBaseUnit } from "@/lib/priceEstimates";
import { normalizeProductName, isSameProduct } from "@/lib/productName";
import { deductIngredientsFromPantry, type DeductionResult } from "@/lib/pantryDeduction";
import {
  syncFullState,
  syncReceipt,
  syncPriceMemoryEntry,
  syncPantryItems,
  syncSavedRecipe,
  deleteSavedRecipeRemote,
} from "@/lib/supabase/sync";

// -----------------------------------------------------------------------
// Utility: tries to sync with Supabase but NEVER blocks the UI.
// The app is "local-first": the local state (localStorage) always wins.
// -----------------------------------------------------------------------
async function trySync(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    // Offline, or Supabase not configured: we keep working locally without breaking anything.
    console.warn("Supabase sync postponed (offline?)", err);
  }
}

function uid() {
  return crypto.randomUUID();
}

interface AppState {
  // ---------- Preferences ----------
  people: number;
  weeklyBudget: number;
  currency: string;
  setPeople: (people: number) => void;
  setWeeklyBudget: (budget: number) => void;

  // ---------- Nutrition goals ----------
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  setNutritionGoals: (goals: Partial<{
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>) => void;

  // ---------- Meal-prep system: cook days vs. days off ----------
  cookDaysPerWeek: number;
  setCookDaysPerWeek: (days: number) => void;

  // ---------- Saved / imported recipes ----------
  savedRecipes: Recipe[];
  addSavedRecipe: (recipe: {
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
    source: "manual" | "import";
    source_url: string | null;
    steps: { text: string; timerMinutes: number | null }[];
    utensils: string[];
    was_adapted: boolean;
    adaptation_note: string | null;
    ingredients: { name: string; quantity: number; unit: string; pantry_category: string; optional: boolean }[];
  }) => void;
  removeSavedRecipe: (id: string) => void;

  // ---------- Pantry (offline-first) ----------
  pantryItems: PantryItem[];
  addPantryItem: (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    location: Location;
    expiration_date?: string | null;
  }) => void;
  consumePantryItem: (id: string, amount: number) => void;
  useAllPantryItem: (id: string) => void;
  removePantryItem: (id: string) => void;
  restockPantryItem: (id: string, amount: number) => void;
  /** Bulk-adds the validated products from a scanned receipt (Part 3). */
  addPantryItemsFromReceipt: (payload: {
    storeName: string | null;
    purchaseDate: string | null;
    items: ScannedReceiptItem[];
  }) => void;
  /** Deducts a recipe's ingredients from the pantry once cooking is done. */
  consumeIngredientsForMeal: (ingredients: PlannedIngredient[]) => DeductionResult[];
  /** Quick add via dictation/free text: interprets several products at once and merges them with existing ones. */
  addPantryItemsSmart: (
    items: { name: string; quantity: number; unit: string; category: string; location: Location }[]
  ) => void;

  // ---------- Personal price memory (Part 4) ----------
  priceMemory: Record<string, PriceMemoryEntry>;
  /** Records the LATEST price paid for a product, replacing any previous data for that same product. */
  updatePriceMemory: (entries: {
    name: string;
    price: number;
    quantity: number;
    unit: string;
    storeName: string | null;
    purchaseDate: string;
  }[]) => void;

  // ---------- Weekly plan (Part 2) ----------
  weekPlan: WeekPlan | null;
  isGeneratingPlan: boolean;
  planError: string | null;
  setWeekPlan: (plan: WeekPlan) => void;
  replaceMealInPlan: (date: string, mealId: string, newMeal: PlannedMeal) => void;
  setPlanGenerating: (loading: boolean) => void;
  setPlanError: (error: string | null) => void;

  // ---------- Grocery list (Part 2) ----------
  groceryItems: GroceryItem[];
  regenerateGroceryList: () => void;
  toggleGroceryChecked: (id: string) => void;
  setGroceryHaveEnough: (id: string, haveEnough: boolean) => void;
  updateGroceryQuantity: (id: string, quantity: number) => void;
  removeGroceryItem: (id: string) => void;
  addManualGroceryItem: (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }) => void;
  addGroceryItemsFromAI: (
    items: { name: string; category: string; quantity: number; unit: string }[]
  ) => void;
  applyGrocerySubstitution: (
    originalName: string,
    replacementName: string,
    newPrice: number
  ) => void;

  // ---------- Sync (Part 3) ----------
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---------- Preferences ----------
      people: 2,
      weeklyBudget: 60,
      currency: "EUR",
      setPeople: (people) => {
        const clamped = Math.max(1, Math.min(12, people));
        set({ people: clamped });
        trySync(async () => {
          await supabase.from("preferences").update({ people: clamped }).neq("id", "");
        });
      },
      setWeeklyBudget: (weeklyBudget) => {
        const clamped = Math.max(10, Math.min(500, weeklyBudget));
        set({ weeklyBudget: clamped });
        trySync(async () => {
          await supabase
            .from("preferences")
            .update({ weekly_budget: clamped })
            .neq("id", "");
        });
      },

      // ---------- Nutrition goals (MealFit's default: vegan, high-protein, calorie-conscious) ----------
      calories: 1900,
      proteinG: 150,
      carbsG: 190,
      fatG: 58,
      setNutritionGoals: (goals) => {
        set((state) => ({
          calories: goals.calories ?? state.calories,
          proteinG: goals.proteinG ?? state.proteinG,
          carbsG: goals.carbsG ?? state.carbsG,
          fatG: goals.fatG ?? state.fatG,
        }));
        const next = get();
        trySync(async () => {
          await supabase
            .from("nutrition_goals")
            .update({
              calories: next.calories,
              protein_g: next.proteinG,
              carbs_g: next.carbsG,
              fat_g: next.fatG,
            })
            .neq("id", "");
        });
      },

      // ---------- Meal-prep system: cook days vs. days off ----------
      cookDaysPerWeek: 4,
      setCookDaysPerWeek: (days) => {
        const clamped = Math.max(1, Math.min(7, Math.round(days)));
        set({ cookDaysPerWeek: clamped });
        trySync(async () => {
          await supabase
            .from("preferences")
            .update({ cook_days_per_week: clamped })
            .neq("id", "");
        });
      },

      // ---------- Saved / imported recipes ----------
      savedRecipes: [],
      addSavedRecipe: (recipe) => {
        const recipeId = uid();
        const newRecipe: Recipe = {
          ...recipe,
          id: recipeId,
          created_at: new Date().toISOString(),
          ingredients: recipe.ingredients.map((ing) => ({
            id: uid(),
            recipe_id: recipeId,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            pantry_category: ing.pantry_category,
            optional: ing.optional,
          })),
        };
        set((state) => ({ savedRecipes: [newRecipe, ...state.savedRecipes] }));
        trySync(() => syncSavedRecipe(newRecipe));
      },
      removeSavedRecipe: (id) => {
        set((state) => ({
          savedRecipes: state.savedRecipes.filter((r) => r.id !== id),
        }));
        trySync(() => deleteSavedRecipeRemote(id));
      },

      // ---------- Pantry ----------
      pantryItems: [],
      addPantryItem: (item) => {
        const now = new Date().toISOString();
        const newItem: PantryItem = {
          id: uid(),
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          location: item.location,
          purchase_date: now.slice(0, 10),
          expiration_date: item.expiration_date ?? null,
          is_empty: item.quantity <= 0,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ pantryItems: [newItem, ...state.pantryItems] }));
        trySync(async () => {
          const { error } = await supabase.from("pantry_items").insert({
            id: newItem.id,
            name: newItem.name,
            category: newItem.category,
            quantity: newItem.quantity,
            unit: newItem.unit,
            location: newItem.location,
            purchase_date: newItem.purchase_date,
            expiration_date: newItem.expiration_date,
            is_empty: newItem.is_empty,
          });
          if (error) throw error;
          await supabase.from("pantry_transactions").insert({
            pantry_item_id: newItem.id,
            type: "add",
            quantity: newItem.quantity,
            unit: newItem.unit,
          });
        });
      },

      consumePantryItem: (id, amount) => {
        set((state) => ({
          pantryItems: state.pantryItems.map((it) => {
            if (it.id !== id) return it;
            const nextQty = Math.max(0, it.quantity - amount);
            return {
              ...it,
              quantity: nextQty,
              is_empty: nextQty <= 0,
              updated_at: new Date().toISOString(),
            };
          }),
        }));
        const item = get().pantryItems.find((it) => it.id === id);
        trySync(async () => {
          if (!item) return;
          await supabase
            .from("pantry_items")
            .update({ quantity: item.quantity, is_empty: item.is_empty })
            .eq("id", id);
          await supabase.from("pantry_transactions").insert({
            pantry_item_id: id,
            type: "consume",
            quantity: amount,
            unit: item.unit,
          });
        });
      },

      useAllPantryItem: (id) => {
        const item = get().pantryItems.find((it) => it.id === id);
        if (!item) return;
        get().consumePantryItem(id, item.quantity);
      },

      removePantryItem: (id) => {
        set((state) => ({
          pantryItems: state.pantryItems.filter((it) => it.id !== id),
        }));
        trySync(async () => {
          await supabase.from("pantry_items").delete().eq("id", id);
        });
      },

      restockPantryItem: (id, amount) => {
        set((state) => ({
          pantryItems: state.pantryItems.map((it) =>
            it.id === id
              ? {
                  ...it,
                  quantity: it.quantity + amount,
                  is_empty: false,
                  updated_at: new Date().toISOString(),
                }
              : it
          ),
        }));
        const item = get().pantryItems.find((it) => it.id === id);
        trySync(async () => {
          if (!item) return;
          await supabase
            .from("pantry_items")
            .update({ quantity: item.quantity, is_empty: false })
            .eq("id", id);
          await supabase.from("pantry_transactions").insert({
            pantry_item_id: id,
            type: "add",
            quantity: amount,
            unit: item.unit,
          });
        });
      },

      addPantryItemsFromReceipt: (payload) => {
        const included = payload.items.filter((i) => i.include);
        if (included.length === 0) return;

        const now = new Date().toISOString();
        const newItems: PantryItem[] = included.map((i) => ({
          id: uid(),
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit,
          location: i.location,
          purchase_date: payload.purchaseDate ?? now.slice(0, 10),
          expiration_date: null,
          is_empty: i.quantity <= 0,
          created_at: now,
          updated_at: now,
        }));

        set((state) => ({ pantryItems: [...newItems, ...state.pantryItems] }));

        // Personal price memory: every product with price > 0 becomes the
        // "latest price paid" for that product (deterministic code).
        get().updatePriceMemory(
          included
            .filter((i) => i.price > 0)
            .map((i) => ({
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              unit: i.unit,
              storeName: payload.storeName,
              purchaseDate: payload.purchaseDate ?? now.slice(0, 10),
            }))
        );

        trySync(async () => {
          const rows = newItems.map((it) => ({
            id: it.id,
            name: it.name,
            category: it.category,
            quantity: it.quantity,
            unit: it.unit,
            location: it.location,
            purchase_date: it.purchase_date,
            expiration_date: it.expiration_date,
            is_empty: it.is_empty,
          }));
          const { error } = await supabase.from("pantry_items").insert(rows);
          if (error) throw error;

          await supabase.from("pantry_transactions").insert(
            newItems.map((it) => ({
              pantry_item_id: it.id,
              type: "add",
              quantity: it.quantity,
              unit: it.unit,
              note: "Added from receipt scan",
            }))
          );

          const totalAmount = included.reduce((sum, i) => sum + i.price, 0);
          await syncReceipt(
            { storeName: payload.storeName, purchaseDate: payload.purchaseDate, totalAmount },
            included.map((i, idx) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              price: i.price,
              pantryItemId: newItems[idx].id,
            }))
          );
        });
      },

      consumeIngredientsForMeal: (ingredients) => {
        const { pantryItems } = get();
        const { items, results } = deductIngredientsFromPantry(pantryItems, ingredients);
        set({ pantryItems: items });

        trySync(async () => {
          // Only re-sync the products that actually changed.
          const changedIds = new Set(
            items
              .filter((next) => {
                const prev = pantryItems.find((p) => p.id === next.id);
                return prev && prev.quantity !== next.quantity;
              })
              .map((it) => it.id)
          );
          for (const item of items) {
            if (!changedIds.has(item.id)) continue;
            await supabase
              .from("pantry_items")
              .update({ quantity: item.quantity, is_empty: item.is_empty })
              .eq("id", item.id);
          }
        });

        return results;
      },

      addPantryItemsSmart: (items) => {
        const now = new Date().toISOString();

        set((state) => {
          let pantryItems = [...state.pantryItems];

          for (const incoming of items) {
            const { value: incomingBase, base: incomingUnitBase } = toBaseUnit(
              incoming.quantity,
              incoming.unit
            );

            // We look for an existing product in the SAME location, the same
            // unit type (g/ml/u), and an equivalent name, to add instead of duplicating.
            const matchIndex = pantryItems.findIndex((it) => {
              if (it.is_empty || it.location !== incoming.location) return false;
              if (!isSameProduct(it.name, incoming.name)) return false;
              const { base } = toBaseUnit(it.quantity, it.unit);
              return base === incomingUnitBase;
            });

            if (matchIndex >= 0) {
              const existing = pantryItems[matchIndex];
              const { value: existingBase, base } = toBaseUnit(existing.quantity, existing.unit);
              const mergedBase = existingBase + incomingBase;
              // We show the merged result in the usual "large" unit (kg/l)
              // once it exceeds 1000, just like in the grocery list.
              const merged =
                base === "g"
                  ? mergedBase >= 1000
                    ? { quantity: +(mergedBase / 1000).toFixed(2), unit: "kg" }
                    : { quantity: Math.round(mergedBase), unit: "g" }
                  : base === "ml"
                  ? mergedBase >= 1000
                    ? { quantity: +(mergedBase / 1000).toFixed(2), unit: "l" }
                    : { quantity: Math.round(mergedBase), unit: "ml" }
                  : { quantity: +mergedBase.toFixed(2), unit: existing.unit };

              pantryItems[matchIndex] = {
                ...existing,
                quantity: merged.quantity,
                unit: merged.unit,
                is_empty: false,
                updated_at: now,
              };
            } else {
              pantryItems = [
                {
                  id: uid(),
                  name: incoming.name,
                  category: incoming.category,
                  quantity: incoming.quantity,
                  unit: incoming.unit,
                  location: incoming.location,
                  purchase_date: now.slice(0, 10),
                  expiration_date: null,
                  is_empty: incoming.quantity <= 0,
                  created_at: now,
                  updated_at: now,
                },
                ...pantryItems,
              ];
            }
          }

          return { pantryItems };
        });

        trySync(async () => {
          // We sync the whole pantry: since quantities can get merged with
          // existing products here, it's simpler and more reliable than
          // manually reconstructing which rows changed.
          await syncPantryItems(get().pantryItems);
        });
      },

      // ---------- Personal price memory ----------
      priceMemory: {},
      updatePriceMemory: (entries) => {
        if (entries.length === 0) return;

        set((state) => {
          const next = { ...state.priceMemory };
          for (const entry of entries) {
            const key = normalizeProductName(entry.name);
            const { pricePerBaseUnit, baseUnit } = computePricePerBaseUnit(
              entry.price,
              entry.quantity,
              entry.unit
            );
            // ALWAYS replaces the previous entry: we only keep the latest purchase.
            next[key] = {
              key,
              displayName: entry.name,
              lastPrice: entry.price,
              packageQuantity: entry.quantity,
              packageUnit: entry.unit,
              pricePerBaseUnit,
              baseUnit,
              storeName: entry.storeName,
              purchaseDate: entry.purchaseDate,
            };
          }
          return { priceMemory: next };
        });

        trySync(async () => {
          const { priceMemory } = get();
          for (const entry of entries) {
            const key = normalizeProductName(entry.name);
            const memoryEntry = priceMemory[key];
            if (memoryEntry) await syncPriceMemoryEntry(memoryEntry);
          }
        });
      },

      // ---------- Weekly plan ----------
      weekPlan: null,
      isGeneratingPlan: false,
      planError: null,
      setWeekPlan: (plan) => {
        set({ weekPlan: plan, planError: null });
        get().regenerateGroceryList();
      },
      replaceMealInPlan: (date, mealId, newMeal) => {
        set((state) => {
          if (!state.weekPlan) return state;
          return {
            weekPlan: {
              ...state.weekPlan,
              days: state.weekPlan.days.map((day) =>
                day.date !== date
                  ? day
                  : {
                      ...day,
                      meals: day.meals.map((m) => (m.id === mealId ? newMeal : m)),
                    }
              ),
            },
          };
        });
        get().regenerateGroceryList();
      },
      setPlanGenerating: (loading) => set({ isGeneratingPlan: loading }),
      setPlanError: (error) => set({ planError: error }),

      // ---------- Grocery list ----------
      groceryItems: [],
      regenerateGroceryList: () => {
        const { weekPlan, pantryItems, groceryItems, priceMemory } = get();
        if (!weekPlan) return;
        const keptItems = groceryItems.filter((i) => i.source !== "plan");
        const nextList = generateGroceryList(weekPlan, pantryItems, keptItems, priceMemory);
        set({ groceryItems: nextList });
      },
      toggleGroceryChecked: (id) => {
        set((state) => ({
          groceryItems: state.groceryItems.map((it) =>
            it.id === id ? { ...it, isChecked: !it.isChecked } : it
          ),
        }));
      },
      setGroceryHaveEnough: (id, haveEnough) => {
        set((state) => ({
          groceryItems: state.groceryItems.map((it) =>
            it.id === id
              ? {
                  ...it,
                  haveEnough,
                  isChecked: haveEnough ? true : it.isChecked,
                  estimatedPrice: haveEnough ? 0 : it.estimatedPrice,
                }
              : it
          ),
        }));
      },
      updateGroceryQuantity: (id, quantity) => {
        set((state) => ({
          groceryItems: state.groceryItems.map((it) => {
            if (it.id !== id) return it;
            const memoryEntry = state.priceMemory[normalizeProductName(it.name)];
            const resolved = resolvePriceForPurchase(it.category, quantity, it.purchaseUnit, memoryEntry);
            return {
              ...it,
              purchaseQuantity: quantity,
              purchaseLabel: `${quantity} ${it.purchaseUnit}`,
              estimatedPrice: resolved.price,
              priceIsEstimated: resolved.isEstimated,
            };
          }),
        }));
      },
      removeGroceryItem: (id) => {
        set((state) => ({
          groceryItems: state.groceryItems.filter((it) => it.id !== id),
        }));
      },
      addManualGroceryItem: (item) => {
        const { priceMemory } = get();
        const memoryEntry = priceMemory[normalizeProductName(item.name)];
        const resolved = resolvePriceForPurchase(item.category, item.quantity, item.unit, memoryEntry);
        const newItem: GroceryItem = {
          id: crypto.randomUUID(),
          name: item.name,
          category: item.category,
          requiredQuantity: item.quantity,
          requiredUnit: item.unit,
          alreadyHaveQuantity: 0,
          alreadyHaveUnit: item.unit,
          purchaseQuantity: item.quantity,
          purchaseUnit: item.unit,
          purchaseLabel: `${item.quantity} ${item.unit}`,
          estimatedPrice: resolved.price,
          priceIsEstimated: resolved.isEstimated,
          isChecked: false,
          haveEnough: false,
          usedInMeals: 0,
          source: "manual",
        };
        set((state) => ({ groceryItems: [...state.groceryItems, newItem] }));
      },
      addGroceryItemsFromAI: (items) => {
        const { priceMemory } = get();
        const newItems: GroceryItem[] = items.map((item) => {
          const memoryEntry = priceMemory[normalizeProductName(item.name)];
          const resolved = resolvePriceForPurchase(item.category, item.quantity, item.unit, memoryEntry);
          return {
            id: crypto.randomUUID(),
            name: item.name,
            category: item.category,
            requiredQuantity: item.quantity,
            requiredUnit: item.unit,
            alreadyHaveQuantity: 0,
            alreadyHaveUnit: item.unit,
            purchaseQuantity: item.quantity,
            purchaseUnit: item.unit,
            purchaseLabel: `${item.quantity} ${item.unit}`,
            estimatedPrice: resolved.price,
            priceIsEstimated: resolved.isEstimated,
            isChecked: false,
            haveEnough: false,
            usedInMeals: 0,
            source: "ai",
          };
        });
        set((state) => ({ groceryItems: [...state.groceryItems, ...newItems] }));
      },
      applyGrocerySubstitution: (originalName, replacementName, newPrice) => {
        set((state) => ({
          groceryItems: state.groceryItems.map((it) =>
            it.name === originalName
              ? {
                  ...it,
                  name: replacementName,
                  estimatedPrice: newPrice,
                  priceIsEstimated: true,
                  purchaseLabel: `${it.purchaseQuantity} ${it.purchaseUnit} (sustituido)`,
                }
              : it
          ),
        }));
      },

      // ---------- Sync ----------
      isSyncing: false,
      lastSyncedAt: null,
      syncNow: async () => {
        if (get().isSyncing) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        set({ isSyncing: true });
        try {
          const state = get();
          const ok = await syncFullState({
            people: state.people,
            weeklyBudget: state.weeklyBudget,
            currency: state.currency,
            cookDaysPerWeek: state.cookDaysPerWeek,
            calories: state.calories,
            proteinG: state.proteinG,
            carbsG: state.carbsG,
            fatG: state.fatG,
            pantryItems: state.pantryItems,
            weekPlan: state.weekPlan,
            groceryItems: state.groceryItems,
            priceMemory: state.priceMemory,
          });
          if (ok) set({ lastSyncedAt: new Date().toISOString() });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "mealfit-storage",
      partialize: (state) => ({
        people: state.people,
        weeklyBudget: state.weeklyBudget,
        currency: state.currency,
        cookDaysPerWeek: state.cookDaysPerWeek,
        calories: state.calories,
        proteinG: state.proteinG,
        carbsG: state.carbsG,
        fatG: state.fatG,
        pantryItems: state.pantryItems,
        weekPlan: state.weekPlan,
        groceryItems: state.groceryItems,
        priceMemory: state.priceMemory,
        savedRecipes: state.savedRecipes,
      }),
    }
  )
);

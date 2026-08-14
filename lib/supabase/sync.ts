import { supabase } from "@/lib/supabase/client";
import type { PantryItem, WeekPlan, GroceryItem, PriceMemoryEntry } from "@/lib/types";

// -----------------------------------------------------------------------
// Local -> Supabase sync (background backup).
//
// The app is Local-First: localStorage ALWAYS wins and the UI never waits
// on this function. It's called:
//   1) After each relevant user action (see lib/store.ts).
//   2) Periodically and when the connection comes back (see SyncManager.tsx).
//
// The "relational" tables (preferences, nutrition_goals, pantry_items) are
// updated row by row. The weekly plan and the grocery list come from the AI
// with a free-form shape (recipe names that don't exist as their own rows
// in `recipes`), so instead of forcing a full relational mapping here
// (which would require creating a recipe per generated meal, risking
// duplicate data), they're saved as a single JSON backup copy in
// `app_state_backup`. It's simple, robust, and always reconstructible.
// -----------------------------------------------------------------------

async function safe(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return true;
  } catch (err) {
    console.warn(`Sync (${label}) postponed:`, err);
    return false;
  }
}

export async function syncPreferences(prefs: {
  people: number;
  weeklyBudget: number;
  currency: string;
}) {
  return safe("preferences", async () => {
    const { error } = await supabase
      .from("preferences")
      .update({
        people: prefs.people,
        weekly_budget: prefs.weeklyBudget,
        currency: prefs.currency,
        updated_at: new Date().toISOString(),
      })
      .neq("id", "");
    if (error) throw error;
  });
}

export async function syncNutritionGoals(goals: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  return safe("nutrition_goals", async () => {
    const { error } = await supabase
      .from("nutrition_goals")
      .update({
        calories: goals.calories,
        protein_g: goals.proteinG,
        carbs_g: goals.carbsG,
        fat_g: goals.fatG,
        updated_at: new Date().toISOString(),
      })
      .neq("id", "");
    if (error) throw error;
  });
}

export async function syncPantryItems(pantryItems: PantryItem[]) {
  return safe("pantry_items", async () => {
    if (pantryItems.length === 0) return;
    const rows = pantryItems.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      quantity: it.quantity,
      unit: it.unit,
      location: it.location,
      purchase_date: it.purchase_date,
      expiration_date: it.expiration_date,
      is_empty: it.is_empty,
      updated_at: it.updated_at,
    }));
    const { error } = await supabase
      .from("pantry_items")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
  });
}

export async function syncPlanAndGroceries(
  weekPlan: WeekPlan | null,
  groceryItems: GroceryItem[]
) {
  return safe("app_state_backup", async () => {
    const { data: existing } = await supabase
      .from("app_state_backup")
      .select("id")
      .limit(1)
      .maybeSingle();

    const payload = {
      week_plan: weekPlan,
      grocery_items: groceryItems,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("app_state_backup")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("app_state_backup").insert(payload);
      if (error) throw error;
    }
  });
}

export async function syncReceipt(
  receipt: { storeName: string | null; purchaseDate: string | null; totalAmount: number },
  items: { name: string; quantity: number; unit: string; price: number; pantryItemId: string }[]
) {
  return safe("receipt", async () => {
    const { data: inserted, error } = await supabase
      .from("receipts")
      .insert({
        store_name: receipt.storeName,
        purchase_date: receipt.purchaseDate ?? new Date().toISOString().slice(0, 10),
        total_amount: receipt.totalAmount,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (items.length > 0 && inserted?.id) {
      const { error: itemsError } = await supabase.from("receipt_items").insert(
        items.map((it) => ({
          receipt_id: inserted.id,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.quantity > 0 ? +(it.price / it.quantity).toFixed(2) : it.price,
          total_price: it.price,
          pantry_item_id: it.pantryItemId,
        }))
      );
      if (itemsError) throw itemsError;
    }
  });
}

/**
 * Personal price memory: replaces (upsert by normalized key) the latest
 * known price for a product. Never stores history.
 */
export async function syncPriceMemoryEntry(entry: PriceMemoryEntry) {
  return safe("price_memory", async () => {
    const { error } = await supabase.from("price_memory").upsert(
      {
        key: entry.key,
        display_name: entry.displayName,
        last_price: entry.lastPrice,
        package_quantity: entry.packageQuantity,
        package_unit: entry.packageUnit,
        price_per_base_unit: entry.pricePerBaseUnit,
        base_unit: entry.baseUnit,
        store_name: entry.storeName,
        purchase_date: entry.purchaseDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw error;
  });
}

/**
 * Full sync: called in the background (see the sync hook) whenever there's
 * a connection, as a safety net in addition to the one-off `trySync` calls
 * already triggered by the store's actions.
 */
export async function syncFullState(state: {
  people: number;
  weeklyBudget: number;
  currency: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  pantryItems: PantryItem[];
  weekPlan: WeekPlan | null;
  groceryItems: GroceryItem[];
  priceMemory: Record<string, PriceMemoryEntry>;
}) {
  const results = await Promise.all([
    syncPreferences({
      people: state.people,
      weeklyBudget: state.weeklyBudget,
      currency: state.currency,
    }),
    syncNutritionGoals({
      calories: state.calories,
      proteinG: state.proteinG,
      carbsG: state.carbsG,
      fatG: state.fatG,
    }),
    syncPantryItems(state.pantryItems),
    syncPlanAndGroceries(state.weekPlan, state.groceryItems),
    ...Object.values(state.priceMemory).map((entry) => syncPriceMemoryEntry(entry)),
  ]);

  return results.every(Boolean);
}

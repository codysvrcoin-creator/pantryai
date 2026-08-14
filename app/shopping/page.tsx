"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertTriangle, Wand2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import GroceryItemRow from "@/components/shopping/GroceryItemRow";
import AddGroceryItemDrawer from "@/components/shopping/AddGroceryItemDrawer";
import OptimizeBudgetDrawer from "@/components/shopping/OptimizeBudgetDrawer";
import { PANTRY_CATEGORIES } from "@/lib/types";

export default function ShoppingPage() {
  const groceryItems = useAppStore((s) => s.groceryItems);
  const weeklyBudget = useAppStore((s) => s.weeklyBudget);
  const currency = useAppStore((s) => s.currency);
  const weekPlan = useAppStore((s) => s.weekPlan);

  const [addOpen, setAddOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);

  const symbol = currency === "EUR" ? "€" : currency;

  const { estimatedCost, remaining, isOverBudget } = useMemo(() => {
    const cost = groceryItems
      .filter((i) => !i.haveEnough)
      .reduce((sum, i) => sum + i.estimatedPrice, 0);
    return {
      estimatedCost: +cost.toFixed(2),
      remaining: +(weeklyBudget - cost).toFixed(2),
      isOverBudget: cost > weeklyBudget,
    };
  }, [groceryItems, weeklyBudget]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof groceryItems>();
    for (const cat of PANTRY_CATEGORIES) map.set(cat, []);
    for (const item of groceryItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [groceryItems]);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 glass border-b border-border px-4 pb-3 pt-safe">
        <div className="flex items-center justify-between pt-3">
          <h1 className="text-2xl font-semibold text-foreground">Grocery List</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAddOpen(true)}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Add product"
          >
            <Plus size={22} />
          </motion.button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-card border border-border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Budget</p>
            <p className="text-sm font-semibold tabular-nums">
              {symbol}
              {weeklyBudget}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Estimated</p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                isOverBudget ? "text-destructive" : "text-foreground"
              }`}
            >
              {symbol}
              {estimatedCost}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Remaining</p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                remaining < 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {symbol}
              {remaining}
            </p>
          </div>
        </div>

        {isOverBudget && (
          <button
            onClick={() => setOptimizeOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-2.5 text-xs font-semibold text-destructive tap-target"
          >
            <AlertTriangle size={14} />
            You're over budget · Optimize with AI
            <Wand2 size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 px-4 pb-6">
        {!weekPlan && groceryItems.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-medium text-foreground">No list yet</p>
            <p className="px-8 text-xs text-muted-foreground">
              Generate your weekly plan in the "Week" tab first and the list will build itself.
            </p>
          </div>
        )}

        {grouped.map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-medium capitalize text-muted-foreground">
              {category} · {items.length}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <GroceryItemRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <AddGroceryItemDrawer open={addOpen} onOpenChange={setAddOpen} />
      <OptimizeBudgetDrawer
        open={optimizeOpen}
        onOpenChange={setOptimizeOpen}
        overBudgetAmount={Math.max(0, -remaining)}
      />
    </div>
  );
}

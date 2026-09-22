"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertTriangle, Wand2, Copy, Share2, Store, Check } from "lucide-react";
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
  const preferredStore = useAppStore((s) => s.preferredStore);

  const [addOpen, setAddOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const symbol = currency === "EUR" ? "€" : currency;

  const checkedCount = groceryItems.filter((i) => i.isChecked || i.haveEnough).length;

  const listAsText = useMemo(() => {
    const lines = groceryItems.map(
      (i) => `${i.isChecked || i.haveEnough ? "[x]" : "[ ]"} ${i.name} — ${i.purchaseLabel}`
    );
    return `Grocery list${preferredStore ? ` (${preferredStore})` : ""}\n${lines.join("\n")}`;
  }, [groceryItems, preferredStore]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(listAsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — silently ignore, the button just won't confirm.
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery list", text: listAsText });
        return;
      } catch {
        // User cancelled or share unsupported — fall back to copy.
      }
    }
    handleCopy();
  };

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
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              This week
            </p>
            <h1 className="text-2xl font-semibold text-foreground">Grocery list</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAddOpen(true)}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Add product"
          >
            <Plus size={22} />
          </motion.button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {preferredStore && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
              <Store size={12} />
              {preferredStore}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-foreground">
            {checkedCount}/{groceryItems.length} done
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground tap-target"
          >
            {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy list"}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground tap-target"
          >
            <Share2 size={14} />
            Share
          </button>
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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

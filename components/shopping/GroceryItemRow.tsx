"use client";

import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { GroceryItem } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  "fruits and vegetables": "🥦",
  "meat and fish": "🍗",
  dairy: "🧀",
  "grains and pasta": "🍝",
  "canned goods": "🥫",
  frozen: "🧊",
  condiments: "🧂",
  beverages: "🥤",
  other: "📦",
};

export default function GroceryItemRow({ item }: { item: GroceryItem }) {
  const toggleGroceryChecked = useAppStore((s) => s.toggleGroceryChecked);
  const setGroceryHaveEnough = useAppStore((s) => s.setGroceryHaveEnough);
  const removeGroceryItem = useAppStore((s) => s.removeGroceryItem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
    >
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            item.isChecked ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {CATEGORY_EMOJI[item.category] ?? "📦"} {item.name}
          {!item.haveEnough && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({item.requiredQuantity}
              {item.requiredUnit} needed)
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {item.alreadyHaveQuantity > 0 &&
            `Already have: ${item.alreadyHaveQuantity}${item.alreadyHaveUnit} · `}
          {item.usedInMeals > 0 && `Used in ${item.usedInMeals} meal${item.usedInMeals > 1 ? "s" : ""}`}
        </p>
        <div className="mt-1 flex gap-2">
          {!item.haveEnough && item.source === "plan" && (
            <button
              onClick={() => setGroceryHaveEnough(item.id, true)}
              className="text-[10px] text-primary underline"
            >
              already have it
            </button>
          )}
          <button onClick={() => removeGroceryItem(item.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Trash2 size={11} />
            remove
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {item.haveEnough ? (
          <span className="text-[10px] font-medium text-primary">Have enough</span>
        ) : (
          <>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {item.purchaseLabel}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {item.estimatedPrice.toFixed(2)}€
              <span className={item.priceIsEstimated ? "" : "text-primary"}>
                {" "}
                {item.priceIsEstimated ? "· est." : "· last price"}
              </span>
            </span>
          </>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => toggleGroceryChecked(item.id)}
        className={`tap-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
          item.isChecked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent"
        }`}
        aria-label="Mark as bought"
      >
        <Check size={16} strokeWidth={3} />
      </motion.button>
    </motion.div>
  );
}

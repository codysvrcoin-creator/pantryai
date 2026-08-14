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

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            item.isChecked ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {CATEGORY_EMOJI[item.category] ?? "📦"} {item.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Needed: {item.requiredQuantity}{item.requiredUnit}
          {item.alreadyHaveQuantity > 0 &&
            ` · Already have: ${item.alreadyHaveQuantity}${item.alreadyHaveUnit}`}
          {!item.haveEnough && ` · Buy: ${item.purchaseLabel}`}
          {item.usedInMeals > 0 && ` · Used in ${item.usedInMeals} meal${item.usedInMeals > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {item.haveEnough ? (
          <span className="text-[10px] font-medium text-primary">Already have enough</span>
        ) : (
          <>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {item.estimatedPrice.toFixed(2)}€
            </span>
            <span
              className={`text-[9px] font-medium ${
                item.priceIsEstimated ? "text-muted-foreground" : "text-primary"
              }`}
            >
              {item.priceIsEstimated ? "Estimated" : "Last price"}
            </span>
          </>
        )}
        <div className="flex gap-1.5 mt-0.5">
          {!item.haveEnough && item.source === "plan" && (
            <button
              onClick={() => setGroceryHaveEnough(item.id, true)}
              className="text-[10px] text-primary underline"
            >
              already have it
            </button>
          )}
          <button onClick={() => removeGroceryItem(item.id)} aria-label="Remove">
            <Trash2 size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

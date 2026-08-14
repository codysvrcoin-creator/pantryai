"use client";

import { motion } from "framer-motion";
import type { PantryItem } from "@/lib/types";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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

export default function PantryItemCard({
  item,
  onTap,
}: {
  item: PantryItem;
  onTap: () => void;
}) {
  const days = daysUntil(item.expiration_date);
  const isSoon = days !== null && days <= 3;
  const isExpired = days !== null && days < 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.96 }}
      onClick={onTap}
      className="flex flex-col items-start gap-2 rounded-3xl bg-card border border-border p-4 text-left"
    >
      <div className="flex w-full items-start justify-between">
        <span className="text-2xl">{CATEGORY_EMOJI[item.category] ?? "📦"}</span>
        {days !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isExpired
                ? "bg-destructive/10 text-destructive"
                : isSoon
                ? "bg-citrus-100 text-citrus-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isExpired ? "expired" : `${days}d`}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.unit}
        </p>
      </div>
    </motion.button>
  );
}

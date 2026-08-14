"use client";

import { motion } from "framer-motion";
import { Flame, Clock, Euro } from "lucide-react";
import type { PlannedMeal } from "@/lib/types";

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MEAL_TYPE_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

export default function MealCard({
  meal,
  onTap,
}: {
  meal: PlannedMeal;
  onTap: () => void;
}) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-card p-4 text-left"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {MEAL_TYPE_EMOJI[meal.mealType]} {MEAL_TYPE_LABEL[meal.mealType]}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Euro size={12} />
          {meal.estimatedCost.toFixed(2)}
        </span>
      </div>

      <p className="text-base font-semibold leading-tight text-foreground">
        {meal.recipeName}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame size={12} className="text-citrus-500" />
          {meal.calories} kcal
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {meal.prepMinutes + meal.cookMinutes} min
        </span>
        <span>P {meal.proteinG}g · C {meal.carbsG}g · F {meal.fatG}g</span>
      </div>
    </motion.button>
  );
}

"use client";

import { motion } from "framer-motion";
import { Clock, Users, Euro, Repeat2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getVibeStyle, getMealThumbnail } from "@/lib/vibeStyle";
import type { PlannedMeal } from "@/lib/types";

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function MealCard({
  meal,
  onTap,
}: {
  meal: PlannedMeal;
  onTap: () => void;
}) {
  const people = useAppStore((s) => s.people);
  const vibeStyle = getVibeStyle(meal.vibe);
  const { emoji, gradient } = getMealThumbnail(meal.recipeName, meal.mealType);

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-3 text-left"
    >
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl"
        style={{ backgroundImage: gradient }}
      >
        {emoji}
        {meal.isLeftover && (
          <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-2 ring-card">
            <Repeat2 size={13} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {MEAL_TYPE_LABEL[meal.mealType]}
        </span>

        <p className="truncate text-[15px] font-semibold leading-tight text-foreground">
          {meal.recipeName}
        </p>

        <span
          className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: vibeStyle.bg, color: vibeStyle.text }}
        >
          {meal.isLeftover ? "Meal-prepped · reheat" : meal.vibe}
        </span>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {meal.prepMinutes + meal.cookMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {people}
          </span>
          <span className="flex items-center gap-1">
            <Euro size={11} />
            {meal.estimatedCost.toFixed(2)}
          </span>
          <span>{meal.calories} kcal</span>
        </div>
      </div>
    </motion.button>
  );
}

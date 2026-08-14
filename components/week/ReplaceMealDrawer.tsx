"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, ChefHat } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { PlannedMeal } from "@/lib/types";

export default function ReplaceMealDrawer({
  date,
  meal,
  onOpenChange,
}: {
  date: string | null;
  meal: PlannedMeal | null;
  onOpenChange: (open: boolean) => void;
}) {
  const weekPlan = useAppStore((s) => s.weekPlan);
  const people = useAppStore((s) => s.people);
  const weeklyBudget = useAppStore((s) => s.weeklyBudget);
  const currency = useAppStore((s) => s.currency);
  const calories = useAppStore((s) => s.calories);
  const proteinG = useAppStore((s) => s.proteinG);
  const carbsG = useAppStore((s) => s.carbsG);
  const fatG = useAppStore((s) => s.fatG);
  const pantryItems = useAppStore((s) => s.pantryItems);
  const replaceMealInPlan = useAppStore((s) => s.replaceMealInPlan);

  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!meal || !date) {
    return (
      <Drawer open={false} onOpenChange={onOpenChange}>
        <DrawerContent />
      </Drawer>
    );
  }

  const otherRecipeNames =
    weekPlan?.days.flatMap((d) => d.meals.map((m) => m.recipeName)).filter(
      (name) => name !== meal.recipeName
    ) ?? [];

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/replace-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType: meal.mealType,
          people,
          weeklyBudget,
          currency,
          calories,
          proteinG,
          carbsG,
          fatG,
          otherRecipeNamesThisWeek: otherRecipeNames,
          userHint: hint,
          pantryItems: pantryItems.map((p) => ({
            name: p.name,
            category: p.category,
            quantity: p.quantity,
            unit: p.unit,
            location: p.location,
            expiration_date: p.expiration_date,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't generate a replacement.");
      replaceMealInPlan(date, meal.id, data.meal);
      setHint("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={!!meal} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{meal.recipeName}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{meal.calories} kcal</span>
            <span>P {meal.proteinG}g</span>
            <span>C {meal.carbsG}g</span>
            <span>F {meal.fatG}g</span>
            <span>{meal.prepMinutes + meal.cookMinutes} min</span>
          </div>

          {meal.instructions && (
            <p className="rounded-2xl bg-muted p-3 text-sm text-foreground">
              {meal.instructions}
            </p>
          )}

          <Link href={`/cook/${meal.id}`} onClick={() => onOpenChange(false)}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background tap-target"
            >
              <ChefHat size={18} />
              Start cooking
            </motion.div>
          </Link>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Ingredients</p>
            <ul className="flex flex-col gap-1">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {ing.quantity}{ing.unit} {ing.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px bg-border" />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Not feeling it? Swap it out
            </p>
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="E.g. something vegetarian and quicker"
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button size="lg" onClick={handleRegenerate} disabled={loading}>
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="mr-2"
              >
                <Loader2 size={18} />
              </motion.span>
            ) : (
              <RefreshCw size={18} className="mr-2" />
            )}
            {loading ? "Finding an alternative..." : "Replace this meal"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

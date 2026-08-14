"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { PlannedMeal } from "@/lib/types";

const SUGGESTIONS = [
  "No oven",
  "Faster",
  "Dairy-free",
  "Less spicy",
  "Gluten-free",
];

export default function AdjustRecipeDrawer({
  open,
  onOpenChange,
  date,
  meal,
  onAdjusted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  meal: PlannedMeal;
  onAdjusted: () => void;
}) {
  const people = useAppStore((s) => s.people);
  const currency = useAppStore((s) => s.currency);
  const pantryItems = useAppStore((s) => s.pantryItems);
  const replaceMealInPlan = useAppStore((s) => s.replaceMealInPlan);

  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/adjust-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMeal: {
            recipeName: meal.recipeName,
            mealType: meal.mealType,
            ingredients: meal.ingredients,
          },
          userHint: text,
          people,
          currency,
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
      if (!res.ok) throw new Error(data.error || "Couldn't adjust the recipe.");
      replaceMealInPlan(date, meal.id, { ...data.meal, id: meal.id });
      setHint("");
      onOpenChange(false);
      onAdjusted();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>✨ Adjust recipe with AI</DrawerTitle>
          <DrawerDescription>
            Tell the AI what you want to change and it will rewrite the steps, ingredients,
            and utensils without leaving cook mode.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setHint(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium tap-target ${
                  hint === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-muted px-4 py-3">
            <input
              autoFocus
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="E.g. I'm out of onion, swap it out"
              className="w-full bg-transparent text-base outline-none"
              onKeyDown={(e) => e.key === "Enter" && submit(hint)}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button size="lg" onClick={() => submit(hint)} disabled={loading || !hint.trim()}>
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="mr-2"
              >
                <Loader2 size={18} />
              </motion.span>
            ) : (
              <Sparkles size={18} className="mr-2" />
            )}
            {loading ? "Adjusting recipe..." : "Adjust recipe"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

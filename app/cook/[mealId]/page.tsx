"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  PackageCheck,
  PartyPopper,
  ChefHat,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getStepsForMeal } from "@/lib/cookingSteps";
import StepTimer from "@/components/cook/StepTimer";
import AdjustRecipeDrawer from "@/components/cook/AdjustRecipeDrawer";
import type { DeductionResult } from "@/lib/pantryDeduction";

export default function CookingModePage() {
  const params = useParams<{ mealId: string }>();
  const router = useRouter();

  const weekPlan = useAppStore((s) => s.weekPlan);
  const consumeIngredientsForMeal = useAppStore((s) => s.consumeIngredientsForMeal);

  const found = useMemo(() => {
    if (!weekPlan) return null;
    for (const day of weekPlan.days) {
      const meal = day.meals.find((m) => m.id === params.mealId);
      if (meal) return { date: day.date, meal };
    }
    return null;
  }, [weekPlan, params.mealId]);

  const meal = found?.meal ?? null;
  const date = found?.date ?? null;

  const steps = useMemo(() => (meal ? getStepsForMeal(meal) : []), [meal]);

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "cooking" | "confirm" | "done">("intro");
  const [deduction, setDeduction] = useState<DeductionResult[] | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  if (!weekPlan || !meal || !date) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">Recipe not found</p>
        <p className="text-sm text-muted-foreground">
          The plan may have been regenerated. Go back to the Cook tab.
        </p>
        <button
          onClick={() => router.push("/cook")}
          className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground tap-target"
        >
          Go back
        </button>
      </div>
    );
  }

  const isLastStep = stepIndex === steps.length - 1;
  const current = steps[stepIndex];

  const goNext = () => {
    if (isLastStep) {
      setPhase("confirm");
    } else {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }
  };
  const goPrev = () => {
    if (stepIndex === 0) {
      setPhase("intro");
    } else {
      setStepIndex((i) => Math.max(0, i - 1));
    }
  };

  const handleUseIngredients = () => {
    const results = consumeIngredientsForMeal(meal.ingredients);
    setDeduction(results);
    setPhase("done");
  };

  const handleAdjusted = () => {
    // The recipe has been rewritten in the store: reset step navigation.
    setStepIndex(0);
    setPhase("intro");
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col px-4 pt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/cook")}
          className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-muted"
          aria-label="Close cook mode"
        >
          <X size={20} />
        </button>

        {phase === "cooking" && steps.length > 0 && (
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {(phase === "intro" || phase === "cooking") ? (
          <button
            onClick={() => setAdjustOpen(true)}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-label="Adjust recipe with AI"
          >
            <Sparkles size={20} />
          </button>
        ) : (
          <div className="h-11 w-11" />
        )}
      </div>

      <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {meal.recipeName}
      </p>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col gap-5 py-6"
          >
            <div className="text-center">
              <ChefHat size={32} className="mx-auto mb-2 text-primary" />
              <p className="text-2xl font-semibold text-foreground">{meal.recipeName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {steps.length} steps · {meal.prepMinutes + meal.cookMinutes} min total
              </p>
            </div>

            {meal.utensils.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Utensils</p>
                <div className="flex flex-wrap gap-2">
                  {meal.utensils.map((u, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Ingredients ({meal.ingredients.length})
              </p>
              <div className="flex flex-col gap-2">
                {meal.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">{ing.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {ing.quantity}
                      {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === "cooking" && (
          <motion.div
            key={`step-${stepIndex}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col items-center justify-center gap-8 py-6"
          >
            <span className="text-sm font-semibold text-primary">
              Step {stepIndex + 1} of {steps.length}
            </span>

            <p className="px-2 text-center text-3xl font-semibold leading-snug text-foreground">
              {current?.text}
            </p>

            {current?.timerMinutes != null && (
              <StepTimer seconds={current.timerMinutes * 60} />
            )}
          </motion.div>
        )}

        {phase === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col gap-5 py-6"
          >
            <div className="text-center">
              <PackageCheck size={36} className="mx-auto mb-2 text-primary" />
              <p className="text-2xl font-semibold text-foreground">Recipe finished!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm what you used so we can deduct it from your pantry.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {meal.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">{ing.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ing.quantity}
                    {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center"
          >
            <PartyPopper size={40} className="text-citrus-500" />
            <p className="text-2xl font-semibold text-foreground">Pantry updated</p>

            <div className="flex w-full flex-col gap-2">
              {(deduction ?? []).map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{d.ingredientName}</span>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      d.fullyCovered
                        ? "text-primary"
                        : d.deductedFromPantry
                        ? "text-citrus-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {d.fullyCovered ? (
                      <>
                        <CheckCircle2 size={13} /> Deducted
                      </>
                    ) : d.deductedFromPantry ? (
                      "Partial · add it to your shopping list"
                    ) : (
                      "Wasn't in your pantry"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky bottom-4 mt-4 flex gap-3 pb-safe">
        {phase === "intro" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase("cooking")}
            className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground tap-target"
          >
            <ListChecks size={22} />
            Start cooking
          </motion.button>
        )}

        {phase === "cooking" && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              className="tap-target flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted"
              aria-label="Previous step"
            >
              <ChevronLeft size={26} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground tap-target"
            >
              {isLastStep ? "I'm done" : "Next step"}
              <ChevronRight size={22} />
            </motion.button>
          </>
        )}

        {phase === "confirm" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleUseIngredients}
            className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground tap-target"
          >
            <PackageCheck size={22} />
            Use these ingredients
          </motion.button>
        )}

        {phase === "done" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/cook")}
            className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground text-lg font-semibold text-background tap-target"
          >
            Back to Cook
          </motion.button>
        )}
      </div>

      <AdjustRecipeDrawer
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        date={date}
        meal={meal}
        onAdjusted={handleAdjusted}
      />
    </div>
  );
}

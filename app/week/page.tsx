"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getWeekStart, getWeekDates, formatDayShort, formatDayLong, todayISO } from "@/lib/weekDates";
import { isWithinTolerance } from "@/lib/nutrition";
import MealCard from "@/components/week/MealCard";
import ReplaceMealDrawer from "@/components/week/ReplaceMealDrawer";
import type { PlannedMeal } from "@/lib/types";

export default function WeekPage() {
  const weekPlan = useAppStore((s) => s.weekPlan);
  const setWeekPlan = useAppStore((s) => s.setWeekPlan);
  const people = useAppStore((s) => s.people);
  const weeklyBudget = useAppStore((s) => s.weeklyBudget);
  const currency = useAppStore((s) => s.currency);
  const calories = useAppStore((s) => s.calories);
  const proteinG = useAppStore((s) => s.proteinG);
  const carbsG = useAppStore((s) => s.carbsG);
  const fatG = useAppStore((s) => s.fatG);
  const pantryItems = useAppStore((s) => s.pantryItems);
  const cookDaysPerWeek = useAppStore((s) => s.cookDaysPerWeek);
  const savedRecipes = useAppStore((s) => s.savedRecipes);
  const isGeneratingPlan = useAppStore((s) => s.isGeneratingPlan);
  const setPlanGenerating = useAppStore((s) => s.setPlanGenerating);
  const planError = useAppStore((s) => s.planError);
  const setPlanError = useAppStore((s) => s.setPlanError);

  const [userPrompt, setUserPrompt] = useState("");
  const [selected, setSelected] = useState<{ date: string; meal: PlannedMeal } | null>(null);

  const weekStartDate = useMemo(() => {
    const d = getWeekStart(new Date());
    return d.toISOString().slice(0, 10);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  const [activeDate, setActiveDate] = useState(() => todayISO());

  const activeDay = weekPlan?.days.find((d) => d.date === activeDate);

  const actual = useMemo(() => {
    const meals = activeDay?.meals ?? [];
    return {
      calories: meals.reduce((sum, m) => sum + m.calories, 0),
      proteinG: +meals.reduce((sum, m) => sum + m.proteinG, 0).toFixed(1),
      carbsG: +meals.reduce((sum, m) => sum + m.carbsG, 0).toFixed(1),
      fatG: +meals.reduce((sum, m) => sum + m.fatG, 0).toFixed(1),
    };
  }, [activeDay]);
  const hasMeals = (activeDay?.meals.length ?? 0) > 0;
  const caloriesOnTarget = isWithinTolerance(actual.calories, calories);

  const handleGenerate = async () => {
    setPlanGenerating(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt,
          people,
          weeklyBudget,
          currency,
          calories,
          proteinG,
          carbsG,
          fatG,
          weekStartDate,
          pantryItems: pantryItems.map((p) => ({
            name: p.name,
            category: p.category,
            quantity: p.quantity,
            unit: p.unit,
            location: p.location,
            expiration_date: p.expiration_date,
          })),
          cookDaysPerWeek,
          savedRecipes: savedRecipes.map((r) => ({
            name: r.name,
            tags: r.tags,
            prepMinutes: r.prep_minutes,
            cookMinutes: r.cook_minutes,
            caloriesPerServing: r.calories_per_serving,
            proteinPerServing: r.protein_per_serving,
            ingredients: (r.ingredients ?? []).map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
            })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate the plan.");
      setWeekPlan(data.weekPlan);
    } catch (err: any) {
      setPlanError(err.message || "An error occurred generating the plan.");
    } finally {
      setPlanGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Your week</h1>
        <p className="text-sm text-muted-foreground">
          Tell the AI how you want it to look, and generate the menu.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-medium text-foreground">
          💬 Tell me how you want this week to look...
        </p>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder='E.g.: "Pasta on Monday, something light on weekdays, and under $40"'
          rows={2}
          className="w-full resize-none rounded-2xl bg-muted px-4 py-3 text-sm outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={isGeneratingPlan}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground tap-target disabled:opacity-60"
        >
          {isGeneratingPlan ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              >
                <Loader2 size={18} />
              </motion.span>
              Generating your week...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {weekPlan ? "Regenerate my week" : "Generate my week"}
            </>
          )}
        </motion.button>
        {planError && (
          <p className="mt-2 rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {planError}
          </p>
        )}
      </div>

      {weekPlan && (
        <>
          {weekPlan.summary && (
            <p className="rounded-2xl bg-accent px-4 py-3 text-xs text-accent-foreground">
              ✨ {weekPlan.summary}
            </p>
          )}

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {weekDates.map((date) => {
              const active = date === activeDate;
              return (
                <button
                  key={date}
                  onClick={() => setActiveDate(date)}
                  className="relative shrink-0 rounded-2xl px-3.5 py-2 tap-target"
                >
                  {active && (
                    <motion.div
                      layoutId="week-day-indicator"
                      className="absolute inset-0 rounded-2xl bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 text-sm font-medium ${
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {formatDayShort(date)}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">{formatDayLong(activeDate)}</p>

          {hasMeals && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Target
                </p>
                <p className="text-xl font-semibold tabular-nums text-foreground">
                  {calories} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  P {proteinG}g · C {carbsG}g · F {fatG}g
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Actual (today)
                </p>
                <p
                  className={`text-xl font-semibold tabular-nums ${
                    caloriesOnTarget ? "text-foreground" : "text-citrus-600"
                  }`}
                >
                  ~{actual.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  P {actual.proteinG}g · C {actual.carbsG}g · F {actual.fatG}g
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pb-6">
            <AnimatePresence mode="popLayout">
              {(activeDay?.meals ?? []).map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onTap={() => setSelected({ date: activeDate, meal })}
                />
              ))}
            </AnimatePresence>
            {(!activeDay || activeDay.meals.length === 0) && (
              <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-border py-14 text-center">
                <p className="text-sm font-medium text-foreground">No meals this day</p>
                <p className="px-8 text-xs text-muted-foreground">
                  The generated plan didn't include meals for this date.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {!weekPlan && !isGeneratingPlan && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <Sparkles size={28} className="text-primary" />
          <p className="text-sm font-medium text-foreground">No plan yet</p>
          <p className="px-8 text-xs text-muted-foreground">
            Write what you feel like eating this week above and hit generate.
          </p>
        </div>
      )}

      <ReplaceMealDrawer
        date={selected?.date ?? null}
        meal={selected?.meal ?? null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

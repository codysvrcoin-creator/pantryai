"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Flame, Clock, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getWeekStart, getWeekDates, formatDayShort, formatDayLong, todayISO } from "@/lib/weekDates";

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

export default function CookPage() {
  const weekPlan = useAppStore((s) => s.weekPlan);

  const weekStartDate = useMemo(() => {
    const d = getWeekStart(new Date());
    return d.toISOString().slice(0, 10);
  }, []);
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  const [activeDate, setActiveDate] = useState(() => todayISO());

  const activeDay = weekPlan?.days.find((d) => d.date === activeDate);
  const meals = activeDay?.meals ?? [];

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Cook Mode</h1>
        <p className="text-sm text-muted-foreground">Choose the day you want to cook</p>
      </header>

      {!weekPlan && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <ChefHat size={28} className="text-primary" />
          <p className="text-sm font-medium text-foreground">You don't have a plan yet</p>
          <p className="px-8 text-xs text-muted-foreground">
            Generate your weekly menu to start cooking step by step from here.
          </p>
          <Link
            href="/week"
            className="mt-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground tap-target"
          >
            Go to Week
          </Link>
        </div>
      )}

      {weekPlan && (
        <>
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
                      layoutId="cook-day-indicator"
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

          <div className="flex flex-col gap-3 pb-6">
            <AnimatePresence mode="popLayout">
              {meals.map((meal) => (
                <Link key={meal.id} href={`/cook/${meal.id}`}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {MEAL_TYPE_EMOJI[meal.mealType]} {MEAL_TYPE_LABEL[meal.mealType]}
                      </span>
                      <p className="text-base font-semibold leading-tight text-foreground">
                        {meal.recipeName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-citrus-500" />
                          {meal.calories} kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {meal.prepMinutes + meal.cookMinutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <ChevronRight size={20} />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </AnimatePresence>

            {meals.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-border py-14 text-center">
                <p className="text-sm font-medium text-foreground">No meals this day</p>
                <p className="px-8 text-xs text-muted-foreground">
                  Choose another day or check your weekly plan in the "Week" tab.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

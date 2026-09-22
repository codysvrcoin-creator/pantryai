"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Flame, Beef, Refrigerator, ChefHat, Store, ChevronRight, ShoppingBag } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { getTimeOfDayGreeting } from "@/lib/greeting";
import BudgetSelector from "@/components/BudgetSelector";
import PeopleSelector from "@/components/PeopleSelector";
import NutritionGoals from "@/components/NutritionGoals";
import CookDaysSelector from "@/components/CookDaysSelector";
import ProfileSelector from "@/components/ProfileSelector";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-card border border-border p-4"
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: accent ?? "hsl(var(--muted))" }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const people = useAppStore((s) => s.people);
  const weeklyBudget = useAppStore((s) => s.weeklyBudget);
  const currency = useAppStore((s) => s.currency);
  const calories = useAppStore((s) => s.calories);
  const proteinG = useAppStore((s) => s.proteinG);
  const cookDaysPerWeek = useAppStore((s) => s.cookDaysPerWeek);
  const pantryItems = useAppStore((s) => s.pantryItems);
  const groceryItems = useAppStore((s) => s.groceryItems);
  const chefName = useAppStore((s) => s.chefName);
  const preferredStore = useAppStore((s) => s.preferredStore);

  const { activeCount, toBuyCount, estimatedCost, checkedCount, totalItems } = useMemo(() => {
    const active = pantryItems.filter((i) => !i.is_empty);
    const pending = groceryItems.filter((i) => !i.isChecked && !i.haveEnough);
    const estimated = pending.reduce((sum, i) => sum + i.estimatedPrice, 0);
    return {
      activeCount: active.length,
      toBuyCount: pending.length,
      estimatedCost: +estimated.toFixed(2),
      checkedCount: groceryItems.filter((i) => i.isChecked || i.haveEnough).length,
      totalItems: groceryItems.length,
    };
  }, [pantryItems, groceryItems]);

  const costRatio = weeklyBudget > 0 ? Math.min(1, estimatedCost / weeklyBudget) : 0;
  const isOverBudget = estimatedCost > weeklyBudget;
  const groceryRatio = totalItems > 0 ? checkedCount / totalItems : 0;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {getTimeOfDayGreeting()}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {chefName ? `${chefName}!` : "MealFit"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          A system, not a diet — vegan, high-protein, calorie-conscious meals, meal-prepped so you
          get real days off from cooking.
        </p>
        {preferredStore && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
            <Store size={12} />
            planned for {preferredStore}
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Est. cost
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(estimatedCost, currency)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / {formatMoney(weeklyBudget, currency)}
            </span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${isOverBudget ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${costRatio * 100}%` }}
            />
          </div>
        </div>

        <Link href="/shopping">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="flex h-full flex-col justify-between rounded-3xl bg-accent p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wide text-accent-foreground/70">
                Tap to view
              </p>
              <ChevronRight size={14} className="text-accent-foreground/70" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
                <ShoppingBag size={14} />
                Grocery list
              </p>
              <p className="mt-0.5 text-[11px] text-accent-foreground/80">
                {checkedCount}/{totalItems} items bought
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent-foreground/15">
                <div
                  className="h-full rounded-full bg-accent-foreground/60"
                  style={{ width: `${groceryRatio * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <ProfileSelector />
        <BudgetSelector />
        <PeopleSelector />
        <CookDaysSelector />
        <NutritionGoals />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">At a glance</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="People" value={String(people)} accent="#2E7D5B" />
          <StatCard icon={Flame} label="Calorie target" value={`${calories} kcal`} accent="#C85C7A" />
          <StatCard icon={Beef} label="Protein target" value={`${proteinG}g`} accent="#4E9C74" />
          <StatCard
            icon={ChefHat}
            label="Cook days"
            value={String(cookDaysPerWeek)}
            sub={`${7 - cookDaysPerWeek} day(s) off`}
            accent="#8E7CC3"
          />
          <StatCard
            icon={Refrigerator}
            label="In the pantry"
            value={String(activeCount)}
            sub="active items"
            accent="#2E7D5B"
          />
        </div>
      </section>
    </div>
  );
}

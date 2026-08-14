"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Wallet, Flame, Beef, Refrigerator, ShoppingCart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import BudgetSelector from "@/components/BudgetSelector";
import PeopleSelector from "@/components/PeopleSelector";
import NutritionGoals from "@/components/NutritionGoals";

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
  const pantryItems = useAppStore((s) => s.pantryItems);
  const groceryItems = useAppStore((s) => s.groceryItems);

  const { activeCount, toBuyCount, estimatedCost } = useMemo(() => {
    const active = pantryItems.filter((i) => !i.is_empty);
    const pending = groceryItems.filter((i) => !i.isChecked && !i.haveEnough);
    const estimated = pending.reduce((sum, i) => sum + i.estimatedPrice, 0);
    return {
      activeCount: active.length,
      toBuyCount: pending.length,
      estimatedCost: +estimated.toFixed(2),
    };
  }, [pantryItems, groceryItems]);

  const remaining = +(weeklyBudget - estimatedCost).toFixed(2);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      <header>
        <p className="text-sm text-muted-foreground">Hi 👋</p>
        <h1 className="text-2xl font-semibold text-foreground">Week overview</h1>
      </header>

      <section className="flex flex-col gap-3">
        <BudgetSelector />
        <PeopleSelector />
        <NutritionGoals />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">At a glance</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="People" value={String(people)} accent="#2E7D5B" />
          <StatCard
            icon={Wallet}
            label="Weekly budget"
            value={formatMoney(weeklyBudget, currency)}
            accent="#FF8A3D"
          />
          <StatCard icon={Flame} label="Calorie target" value={`${calories} kcal`} accent="#C85C7A" />
          <StatCard icon={Beef} label="Protein target" value={`${proteinG}g`} accent="#4E9C74" />
          <StatCard
            icon={Refrigerator}
            label="In the pantry"
            value={String(activeCount)}
            sub="active items"
            accent="#2E7D5B"
          />
          <StatCard
            icon={ShoppingCart}
            label="To buy"
            value={String(toBuyCount)}
            sub={`Estimated cost ${formatMoney(estimatedCost, currency)}`}
            accent="#FF8A3D"
          />
        </div>
      </section>

      <section className="rounded-3xl bg-card border border-border p-4">
        <p className="text-xs text-muted-foreground">Budget remaining this week</p>
        <p
          className={`mt-1 text-3xl font-semibold tabular-nums ${
            remaining < 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {formatMoney(remaining, currency)}
        </p>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const STEP = 5;
const MIN = 10;
const MAX = 500;

export default function BudgetSelector() {
  const weeklyBudget = useAppStore((s) => s.weeklyBudget);
  const setWeeklyBudget = useAppStore((s) => s.setWeeklyBudget);
  const currency = useAppStore((s) => s.currency);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState(String(weeklyBudget));

  const symbol = currency === "EUR" ? "€" : currency;

  const dec = () => setWeeklyBudget(Math.max(MIN, weeklyBudget - STEP));
  const inc = () => setWeeklyBudget(Math.min(MAX, weeklyBudget + STEP));

  const openCustom = () => {
    setCustomValue(String(weeklyBudget));
    setCustomOpen(true);
  };

  const parsedCustom = parseFloat(customValue.replace(",", "."));
  const isCustomValid = !Number.isNaN(parsedCustom) && parsedCustom > 0;

  const confirmCustom = () => {
    if (!isCustomValid) return;
    setWeeklyBudget(Math.round(parsedCustom));
    setCustomOpen(false);
  };

  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl bg-card border border-border p-4">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={dec}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
        aria-label="Decrease budget"
      >
        <Minus size={20} />
      </motion.button>

      <button onClick={openCustom} className="min-w-0 flex-1 text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={weeklyBudget}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="block text-3xl font-semibold tabular-nums text-foreground"
          >
            {formatMoney(weeklyBudget, currency)}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs text-muted-foreground">per week · tap to edit</span>
      </button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={inc}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-label="Increase budget"
      >
        <Plus size={20} />
      </motion.button>

      <Drawer open={customOpen} onOpenChange={setCustomOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Exact budget</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-6 pt-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3">
              <span className="text-2xl text-muted-foreground">{symbol}</span>
              <input
                inputMode="decimal"
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums"
              />
            </div>
            <Button size="lg" onClick={confirmCustom} disabled={!isCustomValid}>
              Save
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

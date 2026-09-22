"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ChefHat } from "lucide-react";
import { useAppStore } from "@/lib/store";

const MIN = 1;
const MAX = 7;

export default function CookDaysSelector() {
  const cookDaysPerWeek = useAppStore((s) => s.cookDaysPerWeek);
  const setCookDaysPerWeek = useAppStore((s) => s.setCookDaysPerWeek);

  const dec = () => setCookDaysPerWeek(Math.max(MIN, cookDaysPerWeek - 1));
  const inc = () => setCookDaysPerWeek(Math.min(MAX, cookDaysPerWeek + 1));
  const offDays = 7 - cookDaysPerWeek;

  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl bg-card border border-border p-4">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={dec}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
        aria-label="Fewer cook days"
      >
        <Minus size={20} />
      </motion.button>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <ChefHat size={16} className="text-muted-foreground" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={cookDaysPerWeek}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="block text-3xl font-semibold tabular-nums text-foreground"
          >
            {cookDaysPerWeek}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs text-muted-foreground text-center">
          cook days · {offDays} {offDays === 1 ? "day" : "days"} off
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={inc}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-label="More cook days"
      >
        <Plus size={20} />
      </motion.button>
    </div>
  );
}

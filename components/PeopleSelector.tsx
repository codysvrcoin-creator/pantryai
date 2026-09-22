"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Users } from "lucide-react";
import { useAppStore } from "@/lib/store";

const MIN = 1;
const MAX = 12;

export default function PeopleSelector() {
  const people = useAppStore((s) => s.people);
  const setPeople = useAppStore((s) => s.setPeople);

  const dec = () => setPeople(Math.max(MIN, people - 1));
  const inc = () => setPeople(Math.min(MAX, people + 1));

  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl bg-card border border-border p-4">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={dec}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
        aria-label="Fewer people"
      >
        <Minus size={20} />
      </motion.button>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <Users size={16} className="text-muted-foreground" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={people}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="block font-heading text-3xl font-bold tabular-nums text-foreground"
          >
            {people}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs text-muted-foreground">
          {people === 1 ? "person" : "people"}
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={inc}
        className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-label="More people"
      >
        <Plus size={20} />
      </motion.button>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

const DAYS = [
  { abbrev: "Mon", letter: "M" },
  { abbrev: "Tue", letter: "T" },
  { abbrev: "Wed", letter: "W" },
  { abbrev: "Thu", letter: "T" },
  { abbrev: "Fri", letter: "F" },
  { abbrev: "Sat", letter: "S" },
  { abbrev: "Sun", letter: "S" },
];

export default function CookDaysToggle() {
  const cookDays = useAppStore((s) => s.cookDays);
  const toggleCookDay = useAppStore((s) => s.toggleCookDay);

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Cooking days</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Which days should we plan fresh meals for?
      </p>
      <div className="mt-3 flex justify-between gap-1.5">
        {DAYS.map(({ abbrev, letter }) => {
          const active = cookDays.includes(abbrev);
          return (
            <motion.button
              key={abbrev}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleCookDay(abbrev)}
              className={`tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
                active
                  ? "border-primary text-primary"
                  : "border-border bg-muted text-muted-foreground"
              }`}
              aria-label={abbrev}
              aria-pressed={active}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-muted-foreground">
        {cookDays.length} cook day{cookDays.length === 1 ? "" : "s"} · {7 - cookDays.length} day(s)
        off
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  caloriesFromMacros,
  isNutritionConsistent,
  resolveByAdjustingCarbs,
} from "@/lib/nutrition";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const PRESETS = [1500, 2000, 2500, 3000];

function MacroRow({
  label,
  value,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(0, value - 5));
  const inc = () => onChange(value + 5);
  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value}
          {unit}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={dec}
          className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border"
        >
          –
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={inc}
          className="tap-target flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

export default function NutritionGoals() {
  const calories = useAppStore((s) => s.calories);
  const proteinG = useAppStore((s) => s.proteinG);
  const carbsG = useAppStore((s) => s.carbsG);
  const fatG = useAppStore((s) => s.fatG);
  const setNutritionGoals = useAppStore((s) => s.setNutritionGoals);

  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customCalories, setCustomCalories] = useState(String(calories));

  const isPreset = PRESETS.includes(calories);
  const impliedCalories = caloriesFromMacros(proteinG, carbsG, fatG);
  const consistent = isNutritionConsistent(calories, proteinG, carbsG, fatG);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-3xl bg-card border border-border p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Daily target</p>
          {!consistent && (
            <span className="flex items-center gap-1 rounded-full bg-citrus-100 px-2 py-0.5 text-[10px] font-medium text-citrus-600">
              <AlertTriangle size={11} />
              Review
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{calories}</span>
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          <span>P {proteinG}g</span>
          <span>C {carbsG}g</span>
          <span>G {fatG}g</span>
        </div>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nutrition goals</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-6 pt-2 flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Daily calories</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <motion.button
                    key={p}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setNutritionGoals({ calories: p })}
                    className={`tap-target rounded-2xl border py-3 text-sm font-medium ${
                      calories === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    }`}
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => {
                  setCustomCalories(String(calories));
                  setCustomOpen(true);
                }}
                className={`mt-2 w-full rounded-2xl border py-3 text-sm font-medium ${
                  !isPreset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                Custom {!isPreset ? `· ${calories} kcal` : ""}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Macronutrients</p>
              <MacroRow
                label="Protein"
                value={proteinG}
                unit="g"
                color="#2E7D5B"
                onChange={(v) => setNutritionGoals({ proteinG: v })}
              />
              <MacroRow
                label="Carbs"
                value={carbsG}
                unit="g"
                color="#FF8A3D"
                onChange={(v) => setNutritionGoals({ carbsG: v })}
              />
              <MacroRow
                label="Fat"
                value={fatG}
                unit="g"
                color="#C85C7A"
                onChange={(v) => setNutritionGoals({ fatG: v })}
              />
            </div>

            <AnimatePresence>
              {!consistent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3 rounded-2xl border border-citrus-100 bg-citrus-100/40 p-4"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-citrus-600" />
                    <p className="text-xs text-citrus-600">
                      P {proteinG}g + C {carbsG}g + F {fatG}g actually add up to{" "}
                      <strong>{impliedCalories} kcal</strong>, not {calories} kcal. Choose how to
                      fix it:
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setNutritionGoals({ calories: impliedCalories })}
                      className="rounded-xl bg-card border border-border py-2.5 text-xs font-semibold text-foreground tap-target"
                    >
                      Use {impliedCalories} kcal (the real total from your macros)
                    </button>
                    <button
                      onClick={() =>
                        setNutritionGoals({
                          carbsG: resolveByAdjustingCarbs(calories, proteinG, fatG),
                        })
                      }
                      className="rounded-xl bg-card border border-border py-2.5 text-xs font-semibold text-foreground tap-target"
                    >
                      Adjust carbs to hit {calories} kcal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={customOpen} onOpenChange={setCustomOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Exact calories</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-6 pt-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3">
              <input
                inputMode="numeric"
                autoFocus
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums"
              />
              <span className="text-lg text-muted-foreground">kcal</span>
            </div>
            <Button
              size="lg"
              onClick={() => {
                const parsed = parseInt(customCalories, 10);
                if (!Number.isNaN(parsed)) {
                  setNutritionGoals({ calories: parsed });
                }
                setCustomOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PANTRY_CATEGORIES } from "@/lib/types";

export default function AddGroceryItemDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addManualGroceryItem = useAppStore((s) => s.addManualGroceryItem);
  const addGroceryItemsFromAI = useAppStore((s) => s.addGroceryItemsFromAI);
  const currency = useAppStore((s) => s.currency);

  const [tab, setTab] = useState<"manual" | "ai">("ai");

  // ---- Manual ----
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("u");
  const [category, setCategory] = useState<string>(PANTRY_CATEGORIES[0]);

  // ---- IA ----
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setQuantity("1");
    setUnit("u");
    setCategory(PANTRY_CATEGORIES[0]);
    setAiText("");
    setAiError(null);
  };

  const handleManualSubmit = () => {
    if (!name.trim()) return;
    addManualGroceryItem({
      name: name.trim(),
      category,
      quantity: parseFloat(quantity.replace(",", ".")) || 1,
      unit,
    });
    reset();
    onOpenChange(false);
  };

  const handleAiSubmit = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/add-grocery-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: aiText, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not interpret the request.");
      addGroceryItemsFromAI(data.items);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setAiError(err.message || "An error occurred.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add to the list</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          <div className="relative flex rounded-2xl bg-muted p-1">
            {(["ai", "manual"] as const).map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="relative flex-1 py-2.5 text-center tap-target"
                >
                  {active && (
                    <motion.div
                      layoutId="add-grocery-tab-indicator"
                      className="absolute inset-0 rounded-xl bg-card shadow-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 text-sm font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {key === "ai" ? "✨ With AI" : "Manual"}
                  </span>
                </button>
              );
            })}
          </div>

          {tab === "ai" && (
            <>
              <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                <textarea
                  autoFocus
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder='E.g.: "napkins and two bottles of red wine" or "aluminum foil"'
                  rows={3}
                  className="w-full resize-none bg-transparent text-base outline-none"
                />
              </div>
              {aiError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
                  {aiError}
                </p>
              )}
              <Button size="lg" onClick={handleAiSubmit} disabled={aiLoading}>
                {aiLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="mr-2"
                  >
                    <Loader2 size={18} />
                  </motion.span>
                ) : (
                  <Sparkles size={18} className="mr-2" />
                )}
                {aiLoading ? "Adding..." : "Add with AI"}
              </Button>
            </>
          )}

          {tab === "manual" && (
            <>
              <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  className="w-full bg-transparent text-base outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                  <label className="text-[10px] text-muted-foreground">Quantity</label>
                  <input
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-transparent text-base outline-none tabular-nums"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                  <label className="text-[10px] text-muted-foreground">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-transparent text-base outline-none"
                  >
                    {["u", "g", "kg", "ml", "l", "package", "can", "dozen"].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                <label className="text-[10px] text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent text-base outline-none capitalize"
                >
                  {PANTRY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <Button size="lg" onClick={handleManualSubmit}>
                Add to list
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

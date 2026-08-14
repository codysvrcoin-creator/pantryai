"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Wand2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

interface Suggestion {
  originalName: string;
  replacementName: string;
  reason: string;
  estimatedNewPrice: number;
}

export default function OptimizeBudgetDrawer({
  open,
  onOpenChange,
  overBudgetAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overBudgetAmount: number;
}) {
  const groceryItems = useAppStore((s) => s.groceryItems);
  const currency = useAppStore((s) => s.currency);
  const applyGrocerySubstitution = useAppStore((s) => s.applyGrocerySubstitution);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const handleOpenChange = (v: boolean) => {
    if (v) fetchSuggestions();
    onOpenChange(v);
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setApplied(new Set());
    try {
      const pendingItems = groceryItems.filter((i) => !i.isChecked && !i.haveEnough);
      const res = await fetch("/api/optimize-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overBudgetAmount,
          currency,
          items: pendingItems.map((i) => ({
            name: i.name,
            category: i.category,
            estimatedPrice: i.estimatedPrice,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not optimize the budget.");
      setSuggestions(data.suggestions ?? []);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (s: Suggestion) => {
    applyGrocerySubstitution(s.originalName, s.replacementName, s.estimatedNewPrice);
    setApplied((prev) => new Set(prev).add(s.originalName));
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Optimize budget</DrawerTitle>
          <DrawerDescription>
            You're over by {overBudgetAmount.toFixed(2)}
            {currency === "EUR" ? "€" : currency}. Here are some cheaper alternatives.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-5 pb-6 pt-2">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-10">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              >
                <Loader2 size={24} className="text-primary" />
              </motion.span>
              <p className="text-xs text-muted-foreground">Looking for alternatives...</p>
            </div>
          )}

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No reasonable cheaper alternatives were found.
            </p>
          )}

          {suggestions.map((s) => {
            const isApplied = applied.has(s.originalName);
            return (
              <div
                key={s.originalName}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {s.originalName} → {s.replacementName}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                  <p className="text-xs font-medium text-primary">
                    New price: {s.estimatedNewPrice.toFixed(2)}
                    {currency === "EUR" ? "€" : currency}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isApplied ? "secondary" : "default"}
                  disabled={isApplied}
                  onClick={() => handleApply(s)}
                >
                  {isApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            );
          })}

          {!loading && (
            <Button variant="outline" size="lg" onClick={fetchSuggestions}>
              <Wand2 size={16} className="mr-2" />
              Find more alternatives
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

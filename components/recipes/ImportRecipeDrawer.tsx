"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Leaf, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ImportedRecipe {
  name: string;
  servingsBase: number;
  tags: string[];
  instructions: string;
  utensils: string[];
  steps: { text: string; timerMinutes: number | null }[];
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    pantryCategory: string;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
  prepMinutes: number;
  cookMinutes: number;
  estimatedCost: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  wasAdapted: boolean;
  adaptationNote: string | null;
  sourceUrl: string | null;
}

export default function ImportRecipeDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const people = useAppStore((s) => s.people);
  const addSavedRecipe = useAppStore((s) => s.addSavedRecipe);

  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedRecipe | null>(null);

  const reset = () => {
    setRawText("");
    setSourceUrl("");
    setPreview(null);
    setError(null);
  };

  const handleImport = async () => {
    if (rawText.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          sourceUrl: sourceUrl.trim() || undefined,
          people,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not import that recipe.");
      setPreview(data.recipe);
    } catch (err: any) {
      setError(err.message || "An error occurred importing the recipe.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!preview) return;
    addSavedRecipe({
      name: preview.name,
      servings_base: preview.servingsBase,
      instructions: preview.instructions,
      prep_minutes: preview.prepMinutes,
      cook_minutes: preview.cookMinutes,
      tags: preview.tags,
      calories_per_serving: preview.caloriesPerServing,
      protein_per_serving: preview.proteinPerServing,
      carbs_per_serving: preview.carbsPerServing,
      fat_per_serving: preview.fatPerServing,
      estimated_cost: preview.estimatedCost,
      source: "import",
      source_url: preview.sourceUrl,
      steps: preview.steps,
      utensils: preview.utensils,
      was_adapted: preview.wasAdapted,
      adaptation_note: preview.adaptationNote,
      ingredients: preview.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        pantry_category: i.pantryCategory,
        optional: false,
      })),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Import a recipe</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          {!preview && (
            <>
              <p className="text-xs text-muted-foreground">
                Paste a caption, ingredient list, or the text of a recipe you saved from
                Instagram, TikTok, Pinterest, or anywhere else. MealFit will turn it into a
                structured recipe and adapt it to be vegan, high-protein, and calorie-conscious if
                it isn't already.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the recipe text here..."
                rows={6}
                className="w-full resize-none rounded-2xl bg-muted px-4 py-3 text-sm outline-none"
              />
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Source link (optional)"
                className="w-full rounded-2xl bg-muted px-4 py-3 text-sm outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleImport}
                disabled={loading || rawText.trim().length < 3}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground tap-target disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <Loader2 size={18} />
                    </motion.span>
                    Reading your recipe...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Import with AI
                  </>
                )}
              </motion.button>
              {error && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
            </>
          )}

          {preview && (
            <>
              <div className="rounded-3xl border border-border bg-muted/40 p-4">
                <p className="text-base font-semibold text-foreground">{preview.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {preview.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  ~{preview.caloriesPerServing} kcal · P {preview.proteinPerServing}g · C{" "}
                  {preview.carbsPerServing}g · F {preview.fatPerServing}g per serving ·{" "}
                  {preview.prepMinutes + preview.cookMinutes} min · serves {preview.servingsBase}
                </p>
                {preview.wasAdapted && preview.adaptationNote && (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl bg-primary/5 p-3">
                    <Leaf size={14} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-xs text-foreground">{preview.adaptationNote}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button size="lg" onClick={handleSave}>
                  <Check size={16} className="mr-1.5" />
                  Save to my recipes
                </Button>
                <button
                  onClick={() => setPreview(null)}
                  className="w-full rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground tap-target"
                >
                  Try a different recipe
                </button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

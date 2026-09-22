"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getVibeStyle } from "@/lib/vibeStyle";
import RecipeCard from "@/components/recipes/RecipeCard";
import ImportRecipeDrawer from "@/components/recipes/ImportRecipeDrawer";

export default function RecipesPage() {
  const savedRecipes = useAppStore((s) => s.savedRecipes);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const vibes = useMemo(() => {
    const set = new Set<string>();
    for (const r of savedRecipes) for (const t of r.tags) set.add(t);
    return Array.from(set).slice(0, 8);
  }, [savedRecipes]);

  const visibleRecipes = activeTag
    ? savedRecipes.filter((r) => r.tags.includes(activeTag))
    : savedRecipes;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Saved recipes</h1>
        <p className="text-sm text-muted-foreground">
          Your own collection — imported from social media or saved from a generated week.
          MealFit reuses these first when it builds your weekly plan and grocery list.
        </p>
      </header>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setImportOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3.5 text-sm font-semibold text-primary tap-target"
      >
        <Plus size={18} />
        Import a recipe
      </motion.button>

      {vibes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Your vibes</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {vibes.map((tag) => {
              const style = getVibeStyle(tag);
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className="shrink-0 rounded-full px-3.5 py-2 text-xs font-medium capitalize tap-target"
                  style={
                    active
                      ? { backgroundColor: style.text, color: "#fff" }
                      : { backgroundColor: style.bg, color: style.text }
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {savedRecipes.length > 0 ? (
        <div className="flex flex-col gap-3 pb-6">
          {visibleRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
          {visibleRecipes.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No saved recipes with that vibe yet.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <BookOpen size={28} className="text-primary" />
          <p className="text-sm font-medium text-foreground">No saved recipes yet</p>
          <p className="px-8 text-xs text-muted-foreground">
            Paste something you saved from Instagram or TikTok and MealFit will structure it for
            you — vegan, high-protein, and ready to slot into your week.
          </p>
        </div>
      )}

      <ImportRecipeDrawer open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

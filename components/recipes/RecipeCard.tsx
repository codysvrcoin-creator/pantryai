"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clock, ChevronDown, Trash2, Leaf, Link as LinkIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const removeSavedRecipe = useAppStore((s) => s.removeSavedRecipe);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left tap-target"
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight text-foreground">{recipe.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {t}
              </span>
            ))}
            {recipe.was_adapted && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Leaf size={10} />
                vegan-adapted
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {recipe.calories_per_serving != null && (
              <span className="flex items-center gap-1">
                <Flame size={12} className="text-citrus-500" />
                {recipe.calories_per_serving} kcal
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {recipe.prep_minutes + recipe.cook_minutes} min
            </span>
            {recipe.protein_per_serving != null && <span>P {recipe.protein_per_serving}g</span>}
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="shrink-0 pt-1">
          <ChevronDown size={18} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              {recipe.instructions && (
                <p className="text-sm text-muted-foreground">{recipe.instructions}</p>
              )}

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ingredients
                  </p>
                  <ul className="flex flex-col gap-1">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing.id} className="text-sm text-foreground">
                        {ing.quantity}
                        {ing.unit} {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.steps.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Steps
                  </p>
                  <ol className="flex flex-col gap-1.5">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="text-sm text-foreground">
                        <span className="font-medium text-muted-foreground">{i + 1}.</span>{" "}
                        {step.text}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {recipe.source_url ? (
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary"
                  >
                    <LinkIcon size={11} />
                    Original source
                  </a>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => removeSavedRecipe(recipe.id)}
                  className="flex items-center gap-1 text-xs text-destructive tap-target"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

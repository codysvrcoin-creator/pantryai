"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Trash2, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import ProfileSelector from "@/components/ProfileSelector";

export default function SettingsPage() {
  const router = useRouter();
  const savedRecipesCount = useAppStore((s) => s.savedRecipes.length);
  const resetSavedRecipes = useAppStore((s) => s.resetSavedRecipes);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetSavedRecipes();
    setConfirmingReset(false);
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <header className="relative flex items-center justify-center">
        <button
          onClick={() => router.back()}
          className="tap-target absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-muted"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your account
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <ProfileSelector />

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          App
        </p>
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          <Link
            href="/preferences"
            className="flex items-center justify-between gap-3 p-4 tap-target"
          >
            <span className="flex items-center gap-3">
              <SlidersHorizontal size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Preferences</span>
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>

          <button
            onClick={handleReset}
            className="flex items-center justify-between gap-3 p-4 text-left tap-target"
          >
            <span>
              <span className="flex items-center gap-3">
                <Trash2 size={16} className={confirmingReset ? "text-destructive" : "text-muted-foreground"} />
                <span className={`text-sm font-medium ${confirmingReset ? "text-destructive" : "text-foreground"}`}>
                  {confirmingReset ? "Tap again to confirm" : "Reset saved recipes"}
                </span>
              </span>
              <span className="ml-7 block text-xs text-muted-foreground">
                {savedRecipesCount > 0
                  ? `Clear all ${savedRecipesCount} saved recipe${savedRecipesCount === 1 ? "" : "s"}`
                  : "You don't have any saved recipes yet"}
              </span>
            </span>
          </button>
        </div>
      </section>

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </p>
        <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            MealFit is a personal, local-first app: everything lives on this device first and
            backs up to your own Supabase project. No account, subscription, or ads — it's built
            for you.
          </p>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";
import StoreSelector from "@/components/StoreSelector";
import PeopleSelector from "@/components/PeopleSelector";
import CookDaysToggle from "@/components/CookDaysToggle";
import BudgetSelector from "@/components/BudgetSelector";
import NutritionGoals from "@/components/NutritionGoals";

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
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
            Your plan
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
        </div>
      </header>

      <CurrencySelector />
      <StoreSelector />
      <PeopleSelector />
      <CookDaysToggle />
      <BudgetSelector />
      <NutritionGoals />
    </div>
  );
}

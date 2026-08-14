"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Location } from "@/lib/types";
import AddItemDrawer from "@/components/pantry/AddItemDrawer";
import ConsumptionDrawer from "@/components/pantry/ConsumptionDrawer";
import PantryItemCard from "@/components/pantry/PantryItemCard";
import ScanReceiptButton from "@/components/pantry/ScanReceiptButton";
import QuickAddDrawer from "@/components/pantry/QuickAddDrawer";

const TABS: { key: Location; label: string }[] = [
  { key: "fridge", label: "Fridge" },
  { key: "pantry", label: "Pantry" },
  { key: "freezer", label: "Freezer" },
];

export default function PantryPage() {
  const [activeTab, setActiveTab] = useState<Location>("fridge");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const pantryItems = useAppStore((s) => s.pantryItems);

  const visibleItems = useMemo(
    () =>
      pantryItems
        .filter((i) => i.location === activeTab && !i.is_empty)
        .sort((a, b) => {
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return a.expiration_date.localeCompare(b.expiration_date);
        }),
    [pantryItems, activeTab]
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Pantry</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setAddOpen(true)}
          className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Add product"
        >
          <Plus size={22} />
        </motion.button>
      </header>

      <ScanReceiptButton />
      <QuickAddDrawer />

      <div className="relative flex rounded-2xl bg-muted p-1">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex-1 py-2.5 text-center tap-target"
            >
              {active && (
                <motion.div
                  layoutId="pantry-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-card shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 text-sm font-medium ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-6">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onTap={() => setSelectedItemId(item.id)}
            />
          ))}
        </AnimatePresence>
        {visibleItems.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-14 text-center">
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="px-8 text-xs text-muted-foreground">
              Tap the + button to add your first product, by typing or dictating.
            </p>
          </div>
        )}
      </div>

      <AddItemDrawer open={addOpen} onOpenChange={setAddOpen} defaultLocation={activeTab} />
      <ConsumptionDrawer
        itemId={selectedItemId}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
      />
    </div>
  );
}

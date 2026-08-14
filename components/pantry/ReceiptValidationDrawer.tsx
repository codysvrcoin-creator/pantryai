"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Store, CalendarDays, CheckCircle2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PANTRY_CATEGORIES, type Location, type ScannedReceipt } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const LOCATIONS: { key: Location; label: string }[] = [
  { key: "fridge", label: "Fridge" },
  { key: "pantry", label: "Pantry" },
  { key: "freezer", label: "Freezer" },
];

export default function ReceiptValidationDrawer({
  receipt,
  onChange,
  onOpenChange,
}: {
  receipt: ScannedReceipt | null;
  onChange: (next: ScannedReceipt) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const addPantryItemsFromReceipt = useAppStore((s) => s.addPantryItemsFromReceipt);

  const total = useMemo(
    () => (receipt?.items ?? []).filter((i) => i.include).reduce((sum, i) => sum + i.price, 0),
    [receipt]
  );
  const includedCount = useMemo(
    () => (receipt?.items ?? []).filter((i) => i.include).length,
    [receipt]
  );

  if (!receipt) {
    return (
      <Drawer open={false} onOpenChange={onOpenChange}>
        <DrawerContent />
      </Drawer>
    );
  }

  const updateItem = (tempId: string, patch: Partial<ScannedReceipt["items"][number]>) => {
    onChange({
      ...receipt,
      items: receipt.items.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)),
    });
  };

  const removeItem = (tempId: string) => {
    onChange({ ...receipt, items: receipt.items.filter((it) => it.tempId !== tempId) });
  };

  const handleConfirm = () => {
    addPantryItemsFromReceipt({
      storeName: receipt.storeName,
      purchaseDate: receipt.purchaseDate,
      items: receipt.items,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={!!receipt} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Review your receipt</DrawerTitle>
          <DrawerDescription>
            The AI read {receipt.items.length} product(s). Edit, uncheck, or remove any before
            adding to the pantry: nothing is saved without your confirmation.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
            <Store size={13} className="shrink-0 text-muted-foreground" />
            <input
              value={receipt.storeName ?? ""}
              onChange={(e) => onChange({ ...receipt, storeName: e.target.value || null })}
              placeholder="Unknown store"
              className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none"
            />
            <span className="h-3 w-px shrink-0 bg-border" />
            <CalendarDays size={13} className="shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={receipt.purchaseDate ?? ""}
              onChange={(e) => onChange({ ...receipt, purchaseDate: e.target.value || null })}
              className="shrink-0 bg-transparent text-xs text-foreground outline-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {receipt.items.map((item) => (
                <motion.div
                  key={item.tempId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={`rounded-3xl border p-3 transition-colors ${
                    item.include ? "border-border bg-card" : "border-border/50 bg-muted/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => updateItem(item.tempId, { include: !item.include })}
                      className="mt-1 tap-target flex h-6 w-6 shrink-0 items-center justify-center"
                      aria-label={item.include ? "Uncheck product" : "Check product"}
                    >
                      <CheckCircle2
                        size={22}
                        className={item.include ? "text-primary" : "text-muted-foreground/40"}
                        fill={item.include ? "currentColor" : "none"}
                        fillOpacity={item.include ? 0.15 : 0}
                      />
                    </button>

                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.tempId, { name: e.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
                    />

                    <button
                      onClick={() => removeItem(item.tempId)}
                      className="tap-target flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground"
                      aria-label="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-2 pl-8">
                    <div className="col-span-1">
                      <label className="text-[9px] text-muted-foreground">Qty.</label>
                      <input
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.tempId, {
                            quantity: parseFloat(e.target.value.replace(",", ".")) || 0,
                          })
                        }
                        className="w-full rounded-xl bg-muted px-2 py-1.5 text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] text-muted-foreground">Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.tempId, { unit: e.target.value })}
                        className="w-full rounded-xl bg-muted px-2 py-1.5 text-xs outline-none"
                      >
                        {["u", "g", "kg", "ml", "l", "package", "can", "dozen"].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] text-muted-foreground">Price</label>
                      <input
                        inputMode="decimal"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.tempId, {
                            price: parseFloat(e.target.value.replace(",", ".")) || 0,
                          })
                        }
                        className="w-full rounded-xl bg-muted px-2 py-1.5 text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] text-muted-foreground">Where</label>
                      <select
                        value={item.location}
                        onChange={(e) =>
                          updateItem(item.tempId, { location: e.target.value as Location })
                        }
                        className="w-full rounded-xl bg-muted px-2 py-1.5 text-xs outline-none"
                      >
                        {LOCATIONS.map((l) => (
                          <option key={l.key} value={l.key}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 pl-8">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.tempId, { category: e.target.value })}
                      className="w-full rounded-xl bg-muted px-2 py-1.5 text-[11px] capitalize text-muted-foreground outline-none"
                    >
                      {PANTRY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {receipt.items.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products left to add.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-accent px-4 py-3 text-xs text-accent-foreground">
            <span>{includedCount} product(s) selected</span>
            <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
          </div>

          <Button size="lg" onClick={handleConfirm} disabled={includedCount === 0}>
            Add {includedCount > 0 ? `${includedCount} ` : ""}to pantry
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

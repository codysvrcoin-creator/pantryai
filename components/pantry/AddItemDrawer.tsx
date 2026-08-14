"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ChevronDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { parseQuickEntry } from "@/lib/parseQuickEntry";
import { PANTRY_CATEGORIES, type Location } from "@/lib/types";

const LOCATIONS: { key: Location; label: string }[] = [
  { key: "fridge", label: "Fridge" },
  { key: "pantry", label: "Pantry" },
  { key: "freezer", label: "Freezer" },
];

export default function AddItemDrawer({
  open,
  onOpenChange,
  defaultLocation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLocation: Location;
}) {
  const addPantryItem = useAppStore((s) => s.addPantryItem);

  const [quickText, setQuickText] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("u");
  const [category, setCategory] = useState<string>(PANTRY_CATEGORIES[0]);
  const [location, setLocation] = useState<Location>(defaultLocation);
  const [expiration, setExpiration] = useState("");

  const reset = () => {
    setQuickText("");
    setShowDetails(false);
    setName("");
    setQuantity("1");
    setUnit("u");
    setCategory(PANTRY_CATEGORIES[0]);
    setLocation(defaultLocation);
    setExpiration("");
  };

  const handleQuickSubmit = () => {
    if (!quickText.trim()) return;
    const parsed = parseQuickEntry(quickText);
    addPantryItem({
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      category,
      location,
      expiration_date: expiration || null,
    });
    reset();
    onOpenChange(false);
  };

  const handleDetailedSubmit = () => {
    if (!name.trim()) return;
    addPantryItem({
      name: name.trim(),
      quantity: parseFloat(quantity.replace(",", ".")) || 1,
      unit,
      category,
      location,
      expiration_date: expiration || null,
    });
    reset();
    onOpenChange(false);
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
          <DrawerTitle>Add product</DrawerTitle>
          <DrawerDescription>
            Type or dictate, for example: "1 kg of rice" or "6 eggs".
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
          {!showDetails && (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3">
                <input
                  autoFocus
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="1 kg of rice"
                  className="w-full bg-transparent text-base outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleQuickSubmit()}
                />
                <Mic size={20} className="text-muted-foreground" />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.key}
                    onClick={() => setLocation(loc.key)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium tap-target ${
                      location === loc.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
              >
                More details (expiration date, category)
                <ChevronDown size={14} />
              </button>

              <Button size="lg" onClick={handleQuickSubmit}>
                Add to pantry
              </Button>
            </>
          )}

          {showDetails && (
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

              <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                <label className="text-[10px] text-muted-foreground">
                  Expires on (optional)
                </label>
                <input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full bg-transparent text-base outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.key}
                    onClick={() => setLocation(loc.key)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium tap-target ${
                      location === loc.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>

              <Button size="lg" onClick={handleDetailedSubmit}>
                Add to pantry
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

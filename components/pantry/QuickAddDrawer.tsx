"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PANTRY_CATEGORIES, type Location } from "@/lib/types";

const LOCATIONS: { key: Location; label: string }[] = [
  { key: "fridge", label: "Fridge" },
  { key: "pantry", label: "Pantry" },
  { key: "freezer", label: "Freezer" },
];

interface QuickItem {
  tempId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location: Location;
  include: boolean;
}

export default function QuickAddDrawer() {
  const addPantryItemsSmart = useAppStore((s) => s.addPantryItemsSmart);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QuickItem[] | null>(null);

  const reset = () => {
    setText("");
    setError(null);
    setItems(null);
  };

  const handleInterpret = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quick-pantry-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not interpret the text.");
      setItems(
        data.items.map((it: any, i: number) => ({
          tempId: `quick-${Date.now()}-${i}`,
          ...it,
          include: true,
        }))
      );
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (tempId: string, patch: Partial<QuickItem>) => {
    setItems((prev) => prev?.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)) ?? null);
  };
  const removeItem = (tempId: string) => {
    setItems((prev) => prev?.filter((it) => it.tempId !== tempId) ?? null);
  };

  const includedCount = items?.filter((i) => i.include).length ?? 0;

  const handleConfirm = () => {
    if (!items) return;
    addPantryItemsSmart(
      items
        .filter((i) => i.include)
        .map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
          location: i.location,
        }))
    );
    reset();
    setOpen(false);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3.5 text-sm font-semibold text-primary tap-target"
      >
        <Mic size={18} />
        Add several at once
      </motion.button>

      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          setOpen(v);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add several products</DrawerTitle>
            <DrawerDescription>
              Dictate or type everything you have at home in one go; use the microphone on
              the iPhone keyboard to speak instead of typing.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-5 pb-6 pt-2">
            {!items && (
              <>
                <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                  <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder='E.g.: "I have two chicken breasts, half a kilo of rice, six eggs, a jar of tomato sauce, and two yogurts"'
                    rows={4}
                    className="w-full resize-none bg-transparent text-base outline-none"
                  />
                </div>
                {error && (
                  <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}
                <Button size="lg" onClick={handleInterpret} disabled={loading || !text.trim()}>
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="mr-2"
                    >
                      <Loader2 size={18} />
                    </motion.span>
                  ) : (
                    <Mic size={18} className="mr-2" />
                  )}
                  {loading ? "Interpreting..." : "Interpret"}
                </Button>
              </>
            )}

            {items && (
              <>
                <p className="text-xs text-muted-foreground">Here's what I understood — review it before adding:</p>
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
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

                        <div className="mt-2 grid grid-cols-3 gap-2 pl-8">
                          <div>
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
                          <div>
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
                          <div>
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

                  {items.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No products left to add.
                    </p>
                  )}
                </div>

                <Button size="lg" onClick={handleConfirm} disabled={includedCount === 0}>
                  Add {includedCount > 0 ? `${includedCount} ` : ""}to pantry
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

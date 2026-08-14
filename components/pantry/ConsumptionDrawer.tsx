"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

function stepFor(unit: string) {
  if (unit === "g" || unit === "ml") return 50;
  if (unit === "kg" || unit === "l") return 0.25;
  return 1;
}

export default function ConsumptionDrawer({
  itemId,
  onOpenChange,
}: {
  itemId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const item = useAppStore((s) =>
    itemId ? s.pantryItems.find((i) => i.id === itemId) : undefined
  );
  const consumePantryItem = useAppStore((s) => s.consumePantryItem);
  const useAllPantryItem = useAppStore((s) => s.useAllPantryItem);
  const removePantryItem = useAppStore((s) => s.removePantryItem);

  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (item) setAmount(stepFor(item.unit));
  }, [item?.id]);

  if (!item) {
    return (
      <Drawer open={false} onOpenChange={onOpenChange}>
        <DrawerContent />
      </Drawer>
    );
  }

  const step = stepFor(item.unit);
  const max = item.quantity;

  const dec = () => setAmount((a) => Math.max(step, +(a - step).toFixed(2)));
  const inc = () => setAmount((a) => Math.min(max, +(a + step).toFixed(2)));

  const confirmConsume = () => {
    consumePantryItem(item.id, amount);
    onOpenChange(false);
  };

  const confirmAll = () => {
    useAllPantryItem(item.id);
    onOpenChange(false);
  };

  const confirmDelete = () => {
    removePantryItem(item.id);
    onOpenChange(false);
  };

  return (
    <Drawer open={!!itemId} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item.name}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-6 px-5 pb-6 pt-2">
          <p className="text-center text-sm text-muted-foreground">
            {item.quantity} {item.unit} left · how much have you used?
          </p>

          <div className="flex items-center justify-center gap-6">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={dec}
              className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-muted"
            >
              <Minus size={22} />
            </motion.button>

            <AnimatePresence mode="popLayout">
              <motion.span
                key={amount}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-[100px] text-center text-3xl font-semibold tabular-nums"
              >
                {amount}
                <span className="ml-1 text-base text-muted-foreground">{item.unit}</span>
              </motion.span>
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={inc}
              className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Plus size={22} />
            </motion.button>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={confirmConsume}>
              Log usage
            </Button>
            <Button size="lg" variant="secondary" onClick={confirmAll}>
              Use it all
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={confirmDelete}
              className="text-destructive"
            >
              <Trash2 size={16} className="mr-2" />
              Delete product
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

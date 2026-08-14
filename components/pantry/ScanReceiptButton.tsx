"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Loader2, Camera, ImageIcon } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import ReceiptValidationDrawer from "@/components/pantry/ReceiptValidationDrawer";
import type { ScannedReceipt } from "@/lib/types";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export default function ScanReceiptButton() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ScannedReceipt | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows re-selecting the same photo later
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const dataUrl = await fileToBase64(file);
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: file.type || "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read the receipt.");
      setReceipt({
        storeName: data.storeName,
        purchaseDate: data.purchaseDate,
        items: data.items,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred reading the receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setPickerOpen(true)}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3.5 text-sm font-semibold text-primary tap-target disabled:opacity-60"
      >
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            >
              <Loader2 size={18} />
            </motion.span>
            Reading your receipt...
          </>
        ) : (
          <>
            <Receipt size={18} />
            Add receipt
          </>
        )}
      </motion.button>

      {error && (
        <p className="mt-2 rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Action sheet: choose between the camera or the Photos library */}
      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add receipt</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-5 pb-6 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setPickerOpen(false);
                cameraInputRef.current?.click();
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left tap-target"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Take photo</p>
                <p className="text-xs text-muted-foreground">Opens the camera right away</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setPickerOpen(false);
                libraryInputRef.current?.click();
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left tap-target"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Choose from Photos</p>
                <p className="text-xs text-muted-foreground">
                  Use a receipt photo you already have saved
                </p>
              </div>
            </motion.button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* capture="environment" opens the rear camera directly in iOS Safari */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {/* Without "capture": Safari offers the iPhone's Photos library */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <ReceiptValidationDrawer
        receipt={receipt}
        onChange={setReceipt}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </>
  );
}

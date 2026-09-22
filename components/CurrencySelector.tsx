"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

const CURRENCIES = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

export default function CurrencySelector() {
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Currency</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {CURRENCIES.map((c) => {
          const active = currency === c.code;
          return (
            <motion.button
              key={c.code}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrency(c.code)}
              className={`tap-target flex flex-col items-center gap-0.5 rounded-2xl border py-2.5 ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <span className="text-base font-semibold">{c.symbol}</span>
              <span className="text-[10px] font-medium">{c.code}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function StoreSelector() {
  const preferredStore = useAppStore((s) => s.preferredStore);
  const setPreferredStore = useAppStore((s) => s.setPreferredStore);
  const [store, setStore] = useState(preferredStore);

  return (
    <label className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Store size={16} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">Supermarket</span>
        <input
          value={store}
          onChange={(e) => setStore(e.target.value)}
          onBlur={() => setPreferredStore(store.trim())}
          placeholder="Any store"
          className="w-full truncate bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </label>
  );
}

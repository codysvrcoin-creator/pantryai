"use client";

import { useState } from "react";
import { User, Store } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ProfileSelector() {
  const chefName = useAppStore((s) => s.chefName);
  const preferredStore = useAppStore((s) => s.preferredStore);
  const setChefName = useAppStore((s) => s.setChefName);
  const setPreferredStore = useAppStore((s) => s.setPreferredStore);

  const [name, setName] = useState(chefName);
  const [store, setStore] = useState(preferredStore);

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex items-center gap-2.5 rounded-3xl border border-border bg-card p-3.5">
        <User size={16} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] text-muted-foreground">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setChefName(name.trim())}
            placeholder="Chef"
            className="w-full truncate bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </label>

      <label className="flex items-center gap-2.5 rounded-3xl border border-border bg-card p-3.5">
        <Store size={16} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] text-muted-foreground">Preferred store</span>
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            onBlur={() => setPreferredStore(store.trim())}
            placeholder="Any store"
            className="w-full truncate bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </label>
    </div>
  );
}

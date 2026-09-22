"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ProfileSelector() {
  const chefName = useAppStore((s) => s.chefName);
  const setChefName = useAppStore((s) => s.setChefName);
  const preferredStore = useAppStore((s) => s.preferredStore);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chefName);

  const save = () => {
    setChefName(name.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Your name"
            className="min-w-0 flex-1 rounded-2xl bg-muted px-3.5 py-2.5 text-lg font-semibold outline-none"
          />
          <button
            onClick={save}
            className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Save name"
          >
            <Check size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-foreground">
            Hi, {chefName || "Chef"}
          </p>
          <button
            onClick={() => {
              setName(chefName);
              setEditing(true);
            }}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-label="Edit name"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
      <p className="mt-1 text-sm text-muted-foreground">
        {preferredStore ? `Shopping at ${preferredStore}` : "No preferred store set yet"}
      </p>
    </div>
  );
}

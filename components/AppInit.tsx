"use client";

// This component used to be wired to `hydrateFromSupabase()`, which pulled
// down a remote backup and could overwrite values the user had already set
// (budget, people, goals, pantry...) as soon as they reopened the app. Now
// the app is truly local-first: whatever is saved on this device
// (localStorage) always wins and is never overwritten automatically.
// Every user action (changing the budget, adding a product, etc.) still
// syncs up to Supabase as a backup (see the `trySync(...)` calls in
// lib/store.ts), but never the other way around automatically.
export default function AppInit() {
  return null;
}

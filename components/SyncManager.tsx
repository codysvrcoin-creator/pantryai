"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

const BACKGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes if there's a connection

/**
 * Renders nothing. Just triggers `syncNow()` (see lib/store.ts) at three
 * moments, always in the background and without blocking the UI:
 *   1. When the app loads, if there's already a connection.
 *   2. The instant the iPhone regains connectivity (the "online" event).
 *   3. Every 5 minutes while the app stays open and connected.
 *
 * If there's no connection, `syncNow()` does nothing (see the
 * `navigator.onLine` check inside the store): the app keeps working 100% offline.
 */
export default function SyncManager() {
  const syncNow = useAppStore((s) => s.syncNow);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator.onLine) syncNow();

    const handleOnline = () => syncNow();
    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => {
      if (navigator.onLine) syncNow();
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

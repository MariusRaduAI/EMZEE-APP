"use client";

import { useMemo } from "react";
import { useStore } from "./store";

/** Returns the id of the next upcoming client (or first available), for prefilling tool pages. */
export function useAutoClient(): string {
  const { db } = useStore();
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = db.clients
      .filter((c) => c.event_date && c.event_date >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
    if (upcoming[0]) return upcoming[0].id;
    return db.clients[0]?.id || "";
  }, [db.clients]);
}

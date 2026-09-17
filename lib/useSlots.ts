"use client";

import type { SlotsPatch, SlotsResponse } from "./types";

export type UseSlots = {
  data: SlotsResponse | undefined;
  error: unknown;
  isLoading: boolean;
  /** Optimistically applies the patch to `meId`'s slots, POSTs it, then revalidates. */
  commit: (patch: SlotsPatch) => Promise<void>;
};

// STUB (Agent B).
export function useSlots(weekStart: Date, meId: string): UseSlots {
  void weekStart;
  void meId;
  return { data: undefined, error: undefined, isLoading: true, commit: async () => {} };
}

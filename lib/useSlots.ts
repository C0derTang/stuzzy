"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { weekRange } from "./time";
import { applyPatch } from "./intervals";
import type { SlotsPatch, SlotsResponse } from "./types";

export type UseSlots = {
  data: SlotsResponse | undefined;
  error: unknown;
  isLoading: boolean;
  /** Optimistically applies the patch to `meId`'s slots, POSTs it, then revalidates. */
  commit: (patch: SlotsPatch) => Promise<void>;
};

async function fetchSlots(url: string): Promise<SlotsResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

// Resolves to undefined (not void) to fit SWR's mutate typing; the result is never cached.
async function postPatch(patch: SlotsPatch): Promise<undefined> {
  const res = await fetch("/api/slots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (res.status === 401) window.location.reload(); // session expired: back to sign-in
  if (!res.ok) throw new Error(`POST /api/slots failed: ${res.status}`);
}

function applyOptimistic(
  cur: SlotsResponse | undefined,
  meId: string,
  patch: SlotsPatch,
): SlotsResponse {
  const base = cur ?? { users: [], intervals: {} };
  return {
    ...base,
    intervals: {
      ...base.intervals,
      [meId]: applyPatch(base.intervals[meId] ?? [], patch),
    },
  };
}

export function useSlots(weekStart: Date, meId: string): UseSlots {
  const { from, to } = weekRange(weekStart);
  const { data, error, isLoading, mutate } = useSWR(
    `/api/slots?from=${from}&to=${to}`,
    fetchSlots,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  const commit = useCallback(
    async (patch: SlotsPatch) => {
      if (!patch.add.length && !patch.remove.length) return;
      try {
        await mutate(postPatch(patch), {
          // Build on what is displayed, not the committed cache, so back-to-back drags compose.
          optimisticData: (_committed, displayed) =>
            applyOptimistic(displayed, meId, patch),
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        });
      } catch (err) {
        // SWR has already rolled the optimistic data back.
        console.error("Saving availability failed", err);
      }
    },
    [mutate, meId],
  );

  return { data, error, isLoading, commit };
}

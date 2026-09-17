"use client";

import type { Run, SlotsPatch, User } from "@/lib/types";

export type WeekGridProps = {
  weekStart: Date;
  me: User;
  users: User[];
  /** Users counted in the heatmap; `included.size` is the "everyone" total. */
  included: Set<string>;
  runs: Run[];
  /** The signed-in user's free slots (epoch ms) in the visible week. */
  mySlots: Set<number>;
  /** Called once per finished drag or tap. */
  onCommit: (patch: SlotsPatch) => void;
};

// STUB (Agent B).
export function WeekGrid({ runs }: WeekGridProps) {
  return <section>{runs.length} runs</section>;
}

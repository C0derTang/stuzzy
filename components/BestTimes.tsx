import type { BestTime, User } from "@/lib/types";

export type BestTimesProps = { items: BestTime[]; users: User[]; total: number };

// STUB (Agent C).
export function BestTimes({ items }: BestTimesProps) {
  return <ul>{items.length}</ul>;
}

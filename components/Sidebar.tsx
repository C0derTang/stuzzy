"use client";

import type { BestTime, User } from "@/lib/types";

export type SidebarProps = {
  me: User;
  users: User[];
  /** Users currently counted in the heatmap. */
  included: Set<string>;
  /** Users with at least one free slot in the visible week. */
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
  bestTimes: BestTime[];
};

// STUB (Agent C).
export function Sidebar({ users }: SidebarProps) {
  return <aside>{users.length} people</aside>;
}

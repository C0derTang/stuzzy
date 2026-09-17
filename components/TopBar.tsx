"use client";

import type { User } from "@/lib/types";

export type TopBarProps = {
  me: User;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

// STUB (Agent C).
export function TopBar({ me }: TopBarProps) {
  return <header>{me.name}</header>;
}

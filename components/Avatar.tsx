import type { User } from "@/lib/types";

export type AvatarProps = { user: User; size?: number; dimmed?: boolean };

// STUB (Agent C).
export function Avatar({ user, size = 24 }: AvatarProps) {
  return <span style={{ width: size, height: size }}>{user.name[0]}</span>;
}

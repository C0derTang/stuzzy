import type { User } from "./types";

// STUB (Agent A). The only way pages and route handlers learn who is signed in.
export async function getUser(): Promise<User | null> {
  return null;
}

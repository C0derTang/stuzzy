// Shared contracts. Every module in the app talks through these shapes.

/** One availability slot is 30 minutes. Slots are identified by their start instant in epoch ms. */
export const SLOT_MS = 30 * 60 * 1000;
export const ROWS_PER_DAY = 48;
export const DAYS_PER_WEEK = 7;

/** Public user shape. Never includes email. */
export type User = {
  id: string;
  name: string;
  image: string | null;
};

/** GET /api/slots?from=<ms>&to=<ms> — free slots (epoch ms, ascending) per user id, for every user. */
export type SlotsResponse = {
  users: User[];
  slots: Record<string, number[]>;
};

/** POST /api/slots — applied to the signed-in user only. */
export type SlotsPatch = {
  add: number[];
  remove: number[];
};

/**
 * A vertical stretch of one day column in which the same set of people is free.
 * `day` is 0-6 within the visible week, rows are 0-47, `endRow` is exclusive.
 */
export type Run = {
  day: number;
  startRow: number;
  endRow: number;
  /** Ids of included users free for the whole run, sorted. Never empty. */
  free: string[];
};

/** A suggested meeting window. `start`/`end` are epoch ms. */
export type BestTime = {
  start: number;
  end: number;
  free: string[];
};

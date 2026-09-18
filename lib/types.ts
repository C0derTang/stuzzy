// Shared contracts. Every module in the app talks through these shapes.

/** Availability is stored as exact ranges with minute precision. */
export const MINUTE_MS = 60 * 1000;
export const MINUTES_PER_DAY = 24 * 60;
export const DAYS_PER_WEEK = 7;

/** Half-open [start, end) range in epoch ms, both minute-aligned, start < end. */
export type Interval = { start: number; end: number };

/** Public user shape. Never includes email. */
export type User = {
  id: string;
  name: string;
  image: string | null;
};

/** GET /api/slots?from=<ms>&to=<ms> — every user's free intervals that overlap [from, to), sorted and merged per user. */
export type SlotsResponse = {
  users: User[];
  intervals: Record<string, Interval[]>;
};

/** POST /api/slots — applied to the signed-in user only: free time = (current ∪ add) − remove. */
export type SlotsPatch = {
  add: Interval[];
  remove: Interval[];
};

/**
 * A vertical stretch of one day column in which the same set of people is free.
 * `day` is 0-6 within the visible week; `startMin`/`endMin` are wall-clock minutes from that
 * day's midnight (0-1440), `endMin` exclusive.
 */
export type Run = {
  day: number;
  startMin: number;
  endMin: number;
  /** Ids of included users free for the whole run, sorted. Never empty. */
  free: string[];
};

/** A suggested meeting window. `start`/`end` are epoch ms. */
export type BestTime = {
  start: number;
  end: number;
  free: string[];
};

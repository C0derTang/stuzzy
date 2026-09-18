import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { intervals, users } from "@/lib/db/schema";
import { applyPatch } from "@/lib/intervals";
import { getUser } from "@/lib/session";
import { isMinuteAligned } from "@/lib/time";
import type { Interval, SlotsPatch, SlotsResponse } from "@/lib/types";

const MAX_SPAN_MS = 8 * 24 * 60 * 60 * 1000;
const MAX_PATCH = 200;
const MAX_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
// Nobody plans further out than this; also keeps `new Date(ms)` valid and bounds what one account can store.
const MAX_DISTANCE_MS = 366 * 24 * 60 * 60 * 1000;
const isNear = (ms: number) => Math.abs(ms - Date.now()) <= MAX_DISTANCE_MS;

const error = (status: number, message: string) => Response.json({ error: message }, { status });

const toInterval = (r: { start: Date; end: Date }): Interval => ({ start: r.start.getTime(), end: r.end.getTime() });

export async function GET(request: Request) {
  if (!(await getUser())) return error(401, "unauthorized");

  const params = new URL(request.url).searchParams;
  const from = Number(params.get("from") ?? NaN);
  const to = Number(params.get("to") ?? NaN);
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from >= to || to - from > MAX_SPAN_MS || !isNear(from)) {
    return error(400, "bad range");
  }

  // Overlapping ranges are returned whole; the client clips them to the view.
  const [userRows, rows] = await db.batch([
    db.select({ id: users.id, name: users.name, image: users.image }).from(users).orderBy(asc(users.name)),
    db
      .select({ userId: intervals.userId, start: intervals.start, end: intervals.end })
      .from(intervals)
      .where(and(lt(intervals.start, new Date(to)), gt(intervals.end, new Date(from))))
      .orderBy(asc(intervals.start)),
  ]);

  const body: SlotsResponse = { users: userRows, intervals: {} };
  for (const row of rows) (body.intervals[row.userId] ??= []).push(toInterval(row));
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

const isInterval = (v: unknown): v is Interval => {
  if (typeof v !== "object" || v === null) return false;
  const { start, end } = v as Record<string, unknown>;
  return (
    typeof start === "number" &&
    typeof end === "number" &&
    isMinuteAligned(start) &&
    isMinuteAligned(end) &&
    start < end &&
    end - start <= MAX_INTERVAL_MS &&
    isNear(start) &&
    isNear(end)
  );
};
const isIntervalList = (v: unknown): v is Interval[] => Array.isArray(v) && v.length <= MAX_PATCH && v.every(isInterval);

export async function POST(request: Request) {
  const me = await getUser();
  if (!me) return error(401, "unauthorized");

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return error(400, "bad patch");
  const { add, remove } = body as Record<string, unknown>;
  if (!isIntervalList(add) || !isIntervalList(remove)) return error(400, "bad patch");
  const patch: SlotsPatch = { add, remove };

  const current = await db
    .select({ start: intervals.start, end: intervals.end })
    .from(intervals)
    .where(eq(intervals.userId, me.id));
  const next = applyPatch(current.map(toInterval), patch);

  // Replace all of the user's rows so they stay merged. A batch is one transaction on neon-http;
  // the insert is skipped when empty because drizzle throws on an empty values() list.
  const del = db.delete(intervals).where(eq(intervals.userId, me.id));
  if (next.length) {
    const rows = next.map(({ start, end }) => ({ userId: me.id, start: new Date(start), end: new Date(end) }));
    await db.batch([del, db.insert(intervals).values(rows)]);
  } else {
    await del;
  }
  return Response.json({ ok: true });
}

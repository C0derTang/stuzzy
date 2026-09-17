import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { slots, users } from "@/lib/db/schema";
import { getUser } from "@/lib/session";
import { isAligned } from "@/lib/time";
import type { SlotsResponse } from "@/lib/types";

const MAX_SPAN_MS = 8 * 24 * 60 * 60 * 1000;
const MAX_PATCH = 700;
// Nobody plans further out than this; also keeps `new Date(ms)` valid and bounds what one account can store.
const MAX_DISTANCE_MS = 366 * 24 * 60 * 60 * 1000;
const isNear = (ms: number) => Math.abs(ms - Date.now()) <= MAX_DISTANCE_MS;

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function GET(request: Request) {
  if (!(await getUser())) return error(401, "unauthorized");

  const params = new URL(request.url).searchParams;
  const from = Number(params.get("from") ?? NaN);
  const to = Number(params.get("to") ?? NaN);
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from >= to || to - from > MAX_SPAN_MS || !isNear(from)) {
    return error(400, "bad range");
  }

  const [userRows, slotRows] = await db.batch([
    db.select({ id: users.id, name: users.name, image: users.image }).from(users).orderBy(asc(users.name)),
    db
      .select()
      .from(slots)
      .where(and(gte(slots.start, new Date(from)), lt(slots.start, new Date(to))))
      .orderBy(asc(slots.start)),
  ]);

  const body: SlotsResponse = { users: userRows, slots: {} };
  for (const { userId, start } of slotRows) (body.slots[userId] ??= []).push(start.getTime());
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

const isSlotList = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length <= MAX_PATCH && v.every((ms) => typeof ms === "number" && isAligned(ms) && isNear(ms));

export async function POST(request: Request) {
  const me = await getUser();
  if (!me) return error(401, "unauthorized");

  const patch: unknown = await request.json().catch(() => null);
  if (typeof patch !== "object" || patch === null) return error(400, "bad patch");
  const { add, remove } = patch as Record<string, unknown>;
  if (!isSlotList(add) || !isSlotList(remove)) return error(400, "bad patch");

  // Built lazily: drizzle throws on an empty values() list.
  const insert = () =>
    db
      .insert(slots)
      .values(add.map((ms) => ({ userId: me.id, start: new Date(ms) })))
      .onConflictDoNothing();
  const del = () =>
    db.delete(slots).where(and(eq(slots.userId, me.id), inArray(slots.start, remove.map((ms) => new Date(ms)))));

  if (add.length && remove.length) await db.batch([insert(), del()]);
  else if (add.length) await insert();
  else if (remove.length) await del();
  return Response.json({ ok: true });
}

// Dev data: five fake users with overlapping free time for this week and next. `pnpm db:seed`
import { inArray } from "drizzle-orm";
import { slots, users } from "../lib/db/schema";
import { addWeeks, cellToInstant, startOfWeek } from "../lib/time";

if (process.env.NODE_ENV === "production") throw new Error("refusing to seed in production");
process.loadEnvFile(".env.local");

// [day (0 = Sunday), start hour, end hour]. Everyone is free Tue 12-1:30, Thu 5-6:30 and Sat 3-4.
type Block = [day: number, from: number, to: number];
const people: Record<string, Block[]> = {
  alice: [[0, 19, 21], [1, 10, 12], [2, 12, 14], [3, 15, 18], [4, 17, 20], [5, 13, 16], [6, 14, 17]],
  ben: [[0, 10, 12], [1, 11, 13], [2, 11.5, 13.5], [3, 16, 19], [4, 16, 18.5], [5, 14, 17], [6, 13, 16]],
  cam: [[0, 19, 22], [1, 9, 11.5], [2, 12, 15], [3, 19, 22], [4, 17, 21], [5, 10, 12], [6, 14, 18]],
  dana: [[0, 20, 23], [1, 11, 12], [2, 10, 13.5], [3, 15, 17], [4, 15, 19], [5, 14, 15.5], [6, 11, 16]],
  eli: [[2, 12, 13.5], [4, 17, 18.5], [6, 15, 16]], // sparse
};
// Next week, these people run an hour later on Sun/Mon/Wed/Fri so the two weeks differ.
const shifted = new Set(["ben", "dana"]);

async function main() {
  const { db } = await import("../lib/db"); // after loadEnvFile: the client reads DATABASE_URL on import
  const names = Object.keys(people);
  const ids = names.map((n) => `dev-${n}`);

  for (const n of names) {
    const row = { email: `dev-${n}@example.invalid`, name: n[0].toUpperCase() + n.slice(1), image: null };
    await db.insert(users).values({ id: `dev-${n}`, ...row }).onConflictDoUpdate({ target: users.id, set: row });
  }
  await db.delete(slots).where(inArray(slots.userId, ids));

  const thisWeek = startOfWeek(new Date());
  const rows: (typeof slots.$inferInsert)[] = [];
  for (const week of [0, 1]) {
    const weekStart = addWeeks(thisWeek, week);
    for (const n of names) {
      for (const [day, from, to] of people[n]) {
        const shift = week === 1 && shifted.has(n) && day % 2 === 1 ? 1 : 0;
        for (let row = (from + shift) * 2; row < (to + shift) * 2; row++) {
          const ms = cellToInstant(weekStart, day, row);
          if (ms !== null) rows.push({ userId: `dev-${n}`, start: new Date(ms) });
        }
      }
    }
  }
  await db.insert(slots).values(rows).onConflictDoNothing();
  console.log(`seeded ${ids.length} users, ${rows.length} slots from ${thisWeek.toDateString()}`);
}

main();

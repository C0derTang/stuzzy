// Dev data: five fake users with overlapping free time for this week and next. `pnpm db:seed`
import { inArray } from "drizzle-orm";
import { intervals, users } from "../lib/db/schema";
import { addWeeks, instantAt, startOfWeek } from "../lib/time";

if (process.env.NODE_ENV === "production") throw new Error("refusing to seed in production");
process.loadEnvFile(".env.local");

// [day (0 = Sunday), "H:MM" start, "H:MM" end]. Everyone is free Tue 12:00-13:30, Thu 17:00-18:30 and Sat 15:00-16:00.
type Block = [day: number, from: string, to: string];
const people: Record<string, Block[]> = {
  alice: [
    [0, "18:45", "21:10"],
    [1, "9:05", "10:40"],
    [2, "11:40", "14:20"],
    [3, "15:10", "18:00"],
    [4, "16:30", "20:15"],
    [5, "13:20", "15:00"],
    [6, "14:00", "17:30"],
  ],
  ben: [
    [0, "10:15", "12:00"],
    [1, "11:00", "13:10"],
    [2, "11:55", "13:35"],
    [3, "16:20", "19:00"],
    [4, "16:00", "18:50"],
    [5, "14:05", "17:00"],
    [6, "12:45", "16:20"],
  ],
  cam: [
    [0, "19:00", "22:30"],
    [1, "9:00", "11:25"],
    [2, "12:00", "15:05"],
    [3, "19:15", "22:00"],
    [4, "17:00", "21:30"],
    [5, "10:10", "12:00"],
    [6, "13:50", "18:00"],
  ],
  dana: [
    [0, "20:00", "23:00"],
    [1, "10:50", "12:15"],
    [2, "10:30", "13:45"],
    [3, "15:00", "17:05"],
    [4, "15:35", "19:00"],
    [5, "13:20", "15:30"],
    [6, "11:00", "16:00"],
  ],
  eli: [[0, "20:30", "21:00"], [2, "12:00", "13:30"], [4, "17:00", "18:30"], [6, "15:00", "16:00"]], // sparse
};
// Next week, these people run an hour later on Mon/Wed/Fri so the two weeks differ.
const shifted = new Set(["ben", "dana"]);

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

async function main() {
  const { db } = await import("../lib/db"); // after loadEnvFile: the client reads DATABASE_URL on import
  const names = Object.keys(people);
  const ids = names.map((n) => `dev-${n}`);

  for (const n of names) {
    const row = { email: `dev-${n}@example.invalid`, name: n[0].toUpperCase() + n.slice(1), image: null };
    await db.insert(users).values({ id: `dev-${n}`, ...row }).onConflictDoUpdate({ target: users.id, set: row });
  }
  await db.delete(intervals).where(inArray(intervals.userId, ids));

  const thisWeek = startOfWeek(new Date());
  const rows: (typeof intervals.$inferInsert)[] = [];
  for (const week of [0, 1]) {
    const weekStart = addWeeks(thisWeek, week);
    for (const n of names) {
      for (const [day, from, to] of people[n]) {
        const shift = week === 1 && shifted.has(n) && day % 2 === 1 ? 60 : 0;
        rows.push({
          userId: `dev-${n}`,
          start: new Date(instantAt(weekStart, day, minutes(from) + shift)),
          end: new Date(instantAt(weekStart, day, minutes(to) + shift)),
        });
      }
    }
  }
  await db.insert(intervals).values(rows);
  console.log(`seeded ${ids.length} users, ${rows.length} intervals from ${thisWeek.toDateString()}`);
}

main();

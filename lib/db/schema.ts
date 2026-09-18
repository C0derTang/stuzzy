import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Google `sub`
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
});

// One row = one free range [start, end), minute-aligned. Rows of a user never overlap or touch:
// the API rewrites them merged on every patch.
export const intervals = pgTable(
  "intervals",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    start: timestamp("start", { withTimezone: true, mode: "date" }).notNull(),
    end: timestamp("end", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("intervals_user_start_idx").on(t.userId, t.start)],
);

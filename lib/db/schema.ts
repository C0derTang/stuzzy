import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Google `sub`
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
});

// One row = one free 30-minute slot.
export const slots = pgTable(
  "slots",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    start: timestamp("start", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.start] }), index("slots_start_idx").on(t.start)],
);

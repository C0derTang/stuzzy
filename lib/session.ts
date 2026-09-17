import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import type { User } from "./types";

// The only way pages and route handlers learn who is signed in.
export async function getUser(): Promise<User | null> {
  // Dev-only bypass for testing without Google. NODE_ENV is "production" in every deployed build.
  if (process.env.NODE_ENV === "development" && process.env.DEV_FAKE_USER) {
    const [row] = await db
      .select({ id: users.id, name: users.name, image: users.image })
      .from(users)
      .where(eq(users.id, process.env.DEV_FAKE_USER));
    return row ?? null;
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? "", image: session.user.image ?? null };
}

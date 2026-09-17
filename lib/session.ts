import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { stanfordEmail } from "./auth-rules";
import { db } from "./db";
import { users } from "./db/schema";
import type { User } from "./types";

const publicColumns = { id: users.id, name: users.name, image: users.image };

async function findUser(id: string): Promise<User | null> {
  const [row] = await db.select(publicColumns).from(users).where(eq(users.id, id));
  return row ?? null;
}

// Dev-only bypass for testing without Google. NODE_ENV is "production" in every deployed build.
const fakeUserId = () => (process.env.NODE_ENV === "development" && process.env.DEV_FAKE_USER) || null;

/**
 * Who is calling a route handler. Only users that passed the Stanford check in `syncUser`
 * have a row, so a signed-in but non-Stanford Clerk session gets null here.
 */
export async function getUser(): Promise<User | null> {
  const fake = fakeUserId();
  if (fake) return findUser(fake);
  const { userId } = await auth();
  return userId ? findUser(userId) : null;
}

/** Page-load gate: checks the Stanford rule against Clerk, then creates/refreshes the user row. */
export async function syncUser(): Promise<User | "denied" | null> {
  const fake = fakeUserId();
  if (fake) return findUser(fake);

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = stanfordEmail(clerkUser);
  if (!email) {
    // Also ends their session and keeps rejected accounts from piling up in Clerk.
    await (await clerkClient()).users.deleteUser(clerkUser.id);
    return "denied";
  }

  const row = { email, name: clerkUser.fullName ?? clerkUser.firstName ?? "Stanford user", image: clerkUser.imageUrl };
  await db.insert(users).values({ id: clerkUser.id, ...row }).onConflictDoUpdate({ target: users.id, set: row });
  return { id: clerkUser.id, name: row.name, image: row.image };
}

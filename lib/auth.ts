import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { isStanfordProfile } from "./auth-rules";
import { db } from "./db";
import { users } from "./db/schema";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ authorization: { params: { hd: "stanford.edu", prompt: "select_account" } } })],
  session: { strategy: "jwt" },
  pages: { signIn: "/", error: "/" },
  callbacks: {
    signIn({ account, profile }) {
      return account?.provider === "google" && isStanfordProfile(profile);
    },
    async jwt({ token, account, profile }) {
      // Only present on the first call after sign-in.
      if (account && profile?.sub) {
        const row = {
          email: profile.email!.toLowerCase(),
          name: profile.name ?? profile.email!,
          image: typeof profile.picture === "string" ? profile.picture : null,
        };
        await db
          .insert(users)
          .values({ id: profile.sub, ...row })
          .onConflictDoUpdate({ target: users.id, set: row });
        token.uid = profile.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});

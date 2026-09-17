# stuzzy

See when everyone's free. A minimalist, liquid-glass week calendar for one Stanford friend group:
drag to paint when you're free, and the heatmap shows where the group overlaps. Slots where
everyone is free glow cardinal.

- Google sign-in, `@stanford.edu` accounts only
- One shared calendar, real dates, week navigation (`←` `→` `t`)
- Hover any block to see who's free and who's busy; sidebar ranks the best times of the week

## Stack

Next.js 16 (App Router) · Auth.js v5 (JWT sessions, no adapter) · Neon Postgres + Drizzle ·
Tailwind v4 + plain CSS glass · SWR · Vitest

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill it in, see below
pnpm db:push                 # create tables in your Neon database
pnpm dev
```

### Environment

| Variable | What |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 33` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client (below) |
| `DEV_FAKE_USER` | Development only. Id of a seeded user (e.g. `dev-alice`) to skip Google locally. Ignored in production. |

### Google OAuth client (one-time, manual)

1. [Google Cloud Console](https://console.cloud.google.com/) → new project → **APIs & Services → OAuth consent screen**.
   Choose **External** and **publish to production** (basic `email`/`profile` scopes need no verification;
   in "Testing" mode only 100 hand-listed users can sign in).
2. **Credentials → Create credentials → OAuth client ID → Web application**. Authorized redirect URIs
   (wildcards are not allowed, so preview deployments cannot sign in):
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-production-domain>/api/auth/callback/google`
3. Put the client id and secret in `.env.local` (and in Vercel for production).

The Stanford restriction is enforced server-side in `lib/auth-rules.ts`: Google must report a verified
email, hosted domain `stanford.edu`, and an address ending in `@stanford.edu`.

### Try it without Google

```bash
pnpm db:seed                          # five fake users with overlapping free time
echo 'DEV_FAKE_USER="dev-alice"' >> .env.local
pnpm dev
```

## Deploy (Vercel)

Import the GitHub repo in Vercel, add the four production environment variables, deploy, then add the
production callback URL to the Google OAuth client.

## How it works

- One row in `slots` = one free 30-minute slot for one user. Painting inserts rows, erasing deletes them,
  overlap is counting. No range merging anywhere.
- `lib/time.ts` does all calendar math in local time (DST-safe); `lib/overlap.ts` turns slots into per-day
  runs for the heatmap; `lib/best-times.ts` ranks meeting windows.
- "Everyone" means the people checked in the sidebar; by default that's whoever has marked time in the
  visible week, so one inactive member never blocks the glow.

## Scripts

`pnpm dev` · `pnpm build` · `pnpm test` · `pnpm lint` · `pnpm typecheck` · `pnpm db:push` · `pnpm db:seed`

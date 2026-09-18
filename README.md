# stuzzy

See when everyone's free. A minimalist, liquid-glass week calendar for one Stanford friend group:
drag to paint when you're free, and the heatmap shows where the group overlaps. Slots where
everyone is free glow cardinal.

- Google sign-in, `@stanford.edu` accounts only
- Drag to paint (15-minute snap) or type exact minutes in the "Add free time" box
- One shared calendar, real dates, week navigation (`←` `→` `t`)
- Hover any block to see who's free and who's busy; sidebar ranks the best times of the week

## Stack

Next.js 16 (App Router) · Clerk · Neon Postgres + Drizzle ·
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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk API keys |
| `DEV_FAKE_USER` | Development only. Id of a seeded user (e.g. `dev-alice`) to skip Google locally. Ignored in production. |

### Sign-in (Clerk)

Auth is [Clerk](https://clerk.com) with Google as the only button. The app runs on a Clerk **development
instance**, which ships with Clerk's shared Google OAuth credentials, so no Google Cloud project is needed.
Trade-offs of a development instance: 100-user cap and a small "development mode" badge. Moving to a Clerk
production instance later requires a custom domain and your own Google OAuth client.

The Stanford restriction is enforced server-side in `lib/auth-rules.ts` + `lib/session.ts`: on page load the
Clerk user must have a **verified Google account at exactly `@stanford.edu`**; anyone else is rejected and
their Clerk user is deleted. Only accepted users get a row in `users`, and the API only serves users with a row.

### Try it without Google

```bash
pnpm db:seed                          # five fake users with overlapping free time
echo 'DEV_FAKE_USER="dev-alice"' >> .env.local
pnpm dev
```

## Deploy (Vercel)

Import the GitHub repo in Vercel, run `vercel integration add clerk` (provisions the Clerk keys), add
`DATABASE_URL`, and deploy.

## How it works

- Free time is stored as exact minute ranges (`intervals` table, one row per merged range). A patch is
  `(current ∪ add) − remove`, computed by `lib/intervals.ts` on both the server and the optimistic client.
- Dragging on the grid snaps to 15 minutes; the "Add free time" box in the sidebar takes any minute.
- `lib/time.ts` does all calendar math in local time (DST-safe); `lib/overlap.ts` sweeps intervals into
  per-day runs for the heatmap; `lib/best-times.ts` ranks meeting windows.
- "Everyone" means the people checked in the sidebar; by default that's whoever has marked time in the
  visible week, so one inactive member never blocks the glow.

## Scripts

`pnpm dev` · `pnpm build` · `pnpm test` · `pnpm lint` · `pnpm typecheck` · `pnpm db:push` · `pnpm db:seed`

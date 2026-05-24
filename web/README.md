# Tiered Cake Company — Next.js + Supabase

Hyderabad home-bakery operations app. Full-stack Next.js 15 (App Router) backed by Supabase Postgres.

## Quickstart

```bash
cd web
npm install
# Apply the schema in Supabase SQL editor, then:
npm run seed          # needs SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run dev
```

Open <http://localhost:3000>.

## Where things live

| Path | What |
|------|------|
| `app/` | Next.js App Router pages + global CSS |
| `app/page.tsx` | Home — Server Component, queries Supabase for headline KPIs |
| `app/layout.tsx` | Root layout, fonts, metadata |
| `app/globals.css` | OKLCH palette, animations, base styles |
| `components/` | Reusable UI primitives (in progress — see MIGRATION-STATUS.md) |
| `lib/format.ts` | Money / date formatters (ported from `app/src/data.jsx`) |
| `middleware.ts` | Supabase auth session refresh on every request |
| `utils/supabase/server.ts` | Server Component client |
| `utils/supabase/client.ts` | Client Component client |
| `utils/supabase/middleware.ts` | Edge middleware client |
| `supabase/migrations/0001_initial_schema.sql` | Initial schema + RLS |
| `scripts/seed.ts` | Seeds Postgres from `../app/data/*.json` |
| `DEPLOY.md` | Step-by-step Supabase + Vercel deploy guide |
| `MIGRATION-STATUS.md` | What's ported from the prototype, what's left |

## Relationship to `../app/`

The original Babel-in-browser prototype still lives in [`../app/`](../app/) and remains AirDrop-able. The Next.js project here is the deployable production-shaped version. Both are kept in sync via the schema + seed script: change the source JSON in `app/data/*.json`, re-run `npm run seed`, and the Postgres tables refresh.

## Env vars

| Var | Used where | Safe to expose? |
|-----|-----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | yes — RLS gates it |
| `SUPABASE_SERVICE_ROLE_KEY` | seed script only | **no** — never commit, never set in Vercel runtime |

## Tooling notes

- React 19, Next.js 15, TypeScript strict mode.
- No CSS framework — design tokens live in `app/globals.css`. Components style inline (matches the prototype's aesthetic).
- Supabase JS client v2 via `@supabase/ssr` for cookie-aware SSR.

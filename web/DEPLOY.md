# Deploy `tieredcake-company` to Vercel + Supabase (free tier)

Step-by-step. Two halves: get Supabase ready, then connect Vercel. Both halves stay on the free tier.

---

## Part 1 — Supabase: apply the schema and seed data

### 1.1 Open your project's SQL editor
You provided this project: <https://qleqgmobvddbdorxymvu.supabase.co>. Open the dashboard:

```
https://supabase.com/dashboard/project/qleqgmobvddbdorxymvu/sql/new
```

### 1.2 Paste the initial schema
Open [`web/supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql) and paste its full contents into the SQL editor. Click **Run**. You should see "Success. No rows returned".

Verify in the Table editor — you should see 12 new tables: `customers`, `orders`, `recipes`, `inventory_items`, `expenses`, `monthly_summary`, `compliance_items`, `campaigns`, `templates`, `audience_segments`, `blocked_dates`, `bakery_settings`.

### 1.3 Get the secret key for seeding (one-time)

The publishable key in `.env.local` is client-safe and **cannot** insert rows under the RLS policies. The seed script needs the secret key (legacy "service_role").

- Dashboard → Settings → API → **Secret key** (the long `sb_secret_...` one)
- Add it to `web/.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxx
```

**Never commit this key.** `.env.local` is already in `.gitignore`.

### 1.4 Run the seed
From the `web/` directory:

```bash
cd web
npm install
npm run seed
```

Expected output:

```
✓ customers: 12 rows
✓ orders: 12 rows
✓ recipes: 8 rows
✓ inventory_items: 20 rows
✓ expenses: 22 rows
✓ monthly_summary: 6 rows
✓ compliance_items: 5 rows
✓ campaigns: ... rows
✓ templates: ... rows
✓ audience_segments: ... rows
✓ blocked_dates: 6 rows
✓ bakery_settings: 1 rows
```

### 1.5 Verify locally
```bash
npm run dev
```

Open <http://localhost:3000>. The home page should show the warm-cream phone mockup with **₹booked**, **pending balance**, **today's bakes**, **tomorrow** cards and **low stock** items populated from Supabase. If you see the dashed "Supabase schema not applied yet" notice instead, the migration didn't run or the seed failed — check the steps above.

---

## Part 2 — Vercel: host it

Two flows. Pick one.

### Flow A — GitHub-connected (recommended; auto-deploy on push)

1. Push this repo to GitHub:
   ```bash
   # from the project root, /Users/vikas/Downloads/Swetha/AMomentWithACake
   git init
   git add .
   git commit -m "Initial commit — Next.js + Supabase migration"
   gh repo create tiered-cake-company --private --source=. --remote=origin --push
   ```
   *(or do this in the GitHub web UI if you don't have `gh` installed)*

2. Go to <https://vercel.com/new> and import the GitHub repo.

3. **Critical**: set **Root Directory** to `web` (not the repo root — Next.js lives in the subdir).

4. Framework Preset: **Next.js** (auto-detected).

5. Build settings — leave defaults:
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

6. **Environment Variables** — copy from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qleqgmobvddbdorxymvu.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_9TN7Ub4Yqb36Sj6iM3EQXw_8AYIbWRm`
   - **Do NOT** add `SUPABASE_SERVICE_ROLE_KEY` here — that key is only for the local seed script, not for runtime.

7. Click **Deploy**. ~2 minutes to first URL.

8. Every `git push` to `main` triggers a redeploy. Branch pushes get preview URLs automatically.

### Flow B — Vercel CLI (no GitHub required)

```bash
npm install -g vercel
cd web
vercel login          # opens browser, log in via your method of choice
vercel link           # creates a new project, prompts for name → "tiered-cake-company"
vercel env add NEXT_PUBLIC_SUPABASE_URL              # paste the URL when prompted
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # paste the publishable key
vercel --prod         # build + deploy
```

Subsequent deploys: `vercel --prod` from `web/`.

---

## Part 3 — Sanity checks after first deploy

1. **Homepage loads** — visit `https://<your-project>.vercel.app/`. The dashboard should populate from Supabase exactly like the local dev preview.

2. **Middleware is running** — open the response headers in DevTools → Network → the document request. You should see Supabase auth cookies being set (`sb-...-auth-token`).

3. **No `service_role` leak** — `view-source:` of the deployed page should NOT contain `sb_secret_`. Only `sb_publishable_` (which is fine to ship).

4. **RLS is on** — try inserting via the publishable key from the browser console:
   ```js
   // In DevTools console
   const { createClient } = window.supabaseInternalsForChecks ?? {};
   // This should fail with "new row violates row-level security policy"
   ```
   If an anon insert succeeds, RLS isn't enabled. Re-check the migration's `enable row level security` lines.

---

## Free-tier ceilings to watch

- **Vercel Hobby**: 100 GB bandwidth/month, 6000 build minutes/month, 1 concurrent build. Hobby allows commercial use only for personal projects — for a real bakery's customer-facing site, upgrade to Pro ($20/mo). Internal-only is fine on Hobby.
- **Supabase Free**: 500 MB Postgres, 1 GB file storage, 5 GB egress/month, 50K monthly active users, 2 active projects. Auto-paused after 1 week of inactivity (resumes on request).

---

## Optional — Agent Skills

You mentioned `npx skills add supabase/agent-skills`. That installs a set of skills for AI coding tools when working against Supabase. From `web/`:

```bash
npx skills add supabase/agent-skills
```

This is optional — your codebase doesn't depend on it. Skip if you don't have the `skills` CLI installed.

---

## Troubleshooting

- **"Module not found: @supabase/ssr"** — run `npm install` in `web/`.
- **Middleware redirects in a loop** — confirm `middleware.ts` matcher excludes static assets (it does in the supplied file).
- **Server component shows "First-run notice" but local does not** — env vars not set in Vercel. Settings → Environment Variables.
- **Seed fails with `permission denied for table customers`** — you're using the publishable key, not the secret key. The seed needs `SUPABASE_SERVICE_ROLE_KEY`.
- **`.env.local` accidentally committed** — `git rm --cached web/.env.local`, re-commit, rotate the keys in Supabase dashboard.

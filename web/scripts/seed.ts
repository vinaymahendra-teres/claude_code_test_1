/**
 * Seed the Supabase database from app/data/*.json.
 *
 * Run after applying the schema migration:
 *   npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS. The
 * publishable key alone won't have permission to write.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import fs from "node:fs";

// Load .env.local manually (tsx doesn't do it by default)
const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Get the service role / secret key from supabase.com/dashboard → Settings → API\n" +
    "(it's the long 'secret' key — never expose this client-side)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const DATA_DIR = resolve(process.cwd(), "..", "app", "data");

async function readJson<T = unknown>(name: string): Promise<T> {
  const raw = await readFile(resolve(DATA_DIR, `${name}.json`), "utf-8");
  return JSON.parse(raw) as T;
}

// Convert camelCase keys to snake_case for Postgres columns
function toSnake<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())] = v;
  }
  return out;
}

async function upsert(table: string, rows: Record<string, unknown>[], conflict = "id") {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows.length} rows`);
}

async function main() {
  console.log(`Seeding ${SUPABASE_URL}\n`);

  // -- Customers --
  const customers = await readJson<Record<string, unknown>[]>("customers");
  await upsert("customers", customers.map(toSnake));

  // -- Orders --
  const orders = await readJson<Record<string, unknown>[]>("orders");
  await upsert("orders", orders.map(toSnake));

  // -- Recipes --
  const recipes = await readJson<Record<string, unknown>[]>("recipes");
  await upsert("recipes", recipes.map(toSnake));

  // -- Inventory --
  const inventory = await readJson<Record<string, unknown>[]>("inventory");
  await upsert("inventory_items", inventory.map(toSnake));

  // -- Finance (expenses + monthly summary + compliance) --
  const finance = await readJson<{
    expenses: Record<string, unknown>[];
    monthlySummary: Record<string, unknown>[];
    compliance: Record<string, unknown>[];
  }>("finance");
  await upsert("expenses", finance.expenses.map(toSnake));
  await upsert("monthly_summary", finance.monthlySummary.map(toSnake), "month");
  await upsert("compliance_items", finance.compliance.map(toSnake));

  // -- Marketing --
  const marketing = await readJson<{
    campaigns?: Record<string, unknown>[];
    templates?: Record<string, unknown>[];
    segments?: Record<string, unknown>[];
  }>("marketing");
  if (marketing.campaigns) {
    await upsert(
      "campaigns",
      marketing.campaigns.map((c) => ({ id: c.id as string, data: c })),
    );
  }
  if (marketing.templates) {
    await upsert(
      "templates",
      marketing.templates.map((t) => ({ id: t.id as string, data: t })),
    );
  }
  if (marketing.segments) {
    await upsert(
      "audience_segments",
      marketing.segments.map((s) => ({ id: s.id as string, data: s })),
    );
  }

  // -- Calendar --
  const calendar = await readJson<{
    capacityCeiling: number;
    blockedDates: { date: string; reason: string; type: string }[];
  }>("calendar");
  await upsert("blocked_dates", calendar.blockedDates);
  await upsert(
    "bakery_settings",
    [{ key: "capacity_ceiling", value: { value: calendar.capacityCeiling } }],
    "key",
  );

  console.log("\nDone. Verify in supabase dashboard → table editor.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Seed customisation_addons with a starter catalogue of the additions
 * a Hyderabad home bakery commonly sells. Idempotent: deterministic IDs
 * mean re-running upserts, never duplicates.
 *
 *   npm run seed:addons
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import fs from "node:fs";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

type Row = {
  id: string;
  name: string;
  category:
    | "figurine"
    | "topper"
    | "decor"
    | "finish"
    | "shape"
    | "technique"
    | "dietary"
    | "other";
  default_cost: number;
  default_qty?: number;
  unit?: string;
  notes?: string;
  sort_order: number;
};

const ADDONS: Row[] = [
  // ---- Figurines / Toppers ----
  { id: "ca-fondant-fig-small", name: "Fondant figurine — small", category: "figurine", default_cost: 250, unit: "each", sort_order: 10, notes: "3–5cm tall, single character or object" },
  { id: "ca-fondant-fig-large", name: "Fondant figurine — large", category: "figurine", default_cost: 600, unit: "each", sort_order: 20, notes: "6–10cm, intricate detail" },
  { id: "ca-cake-topper-custom", name: "Acrylic cake topper — custom text", category: "topper", default_cost: 350, unit: "each", sort_order: 30, notes: "Order 3–4 days ahead" },
  { id: "ca-number-candle", name: "Number candle", category: "topper", default_cost: 80, unit: "each", sort_order: 40 },

  // ---- Decor finishes ----
  { id: "ca-gold-leaf", name: "Gold leaf finish", category: "finish", default_cost: 400, unit: "set", sort_order: 50, notes: "Edible 23k leaf, applied on cooled buttercream" },
  { id: "ca-edible-image", name: "Edible image print", category: "decor", default_cost: 150, unit: "each", sort_order: 60, notes: "Up to A4; printed by external vendor" },
  { id: "ca-fresh-flowers", name: "Fresh flower decor", category: "decor", default_cost: 500, unit: "set", sort_order: 70, notes: "Food-safe wrap; sourced D-1" },
  { id: "ca-piped-roses", name: "Hand-piped buttercream roses", category: "technique", default_cost: 500, unit: "set", sort_order: 80, notes: "Approx. 12 roses; +1.5h prep" },
  { id: "ca-ombre", name: "Ombre buttercream", category: "technique", default_cost: 200, sort_order: 90 },
  { id: "ca-drip", name: "Chocolate drip", category: "technique", default_cost: 150, sort_order: 100 },
  { id: "ca-mirror-glaze", name: "Mirror glaze", category: "technique", default_cost: 700, sort_order: 110, notes: "Set in fridge 1h before transport" },
  { id: "ca-isomalt", name: "Isomalt sail / shard", category: "technique", default_cost: 600, sort_order: 120 },
  { id: "ca-sparkler", name: "Cake sparkler", category: "decor", default_cost: 100, unit: "each", sort_order: 130 },

  // ---- Shape ----
  { id: "ca-shape-number", name: "Number cake shape", category: "shape", default_cost: 600, sort_order: 200, notes: "Single digit; double = 2× price" },
  { id: "ca-shape-letter", name: "Letter cake shape", category: "shape", default_cost: 600, sort_order: 210 },
  { id: "ca-shape-heart", name: "Heart shape", category: "shape", default_cost: 250, sort_order: 220 },
  { id: "ca-shape-character", name: "Character / themed shape", category: "shape", default_cost: 1200, sort_order: 230, notes: "Quote based on complexity" },

  // ---- Dietary ----
  { id: "ca-eggless-build", name: "Eggless build", category: "dietary", default_cost: 0, sort_order: 300, notes: "Already a flag on order; price-neutral by policy" },
  { id: "ca-gluten-free", name: "Gluten-free flour swap", category: "dietary", default_cost: 250, sort_order: 310 },
  { id: "ca-sugar-free", name: "Sugar-free / sweetener swap", category: "dietary", default_cost: 200, sort_order: 320 },
  { id: "ca-nut-free", name: "Nut-free build", category: "dietary", default_cost: 0, sort_order: 330, notes: "Cross-contamination disclaimer in DM" },
  { id: "ca-vegan", name: "Vegan build (no dairy + eggless)", category: "dietary", default_cost: 400, sort_order: 340 },
];

async function main() {
  const rows = ADDONS.map((r) => ({
    ...r,
    is_active: true,
    default_qty: r.default_qty ?? 1,
    unit: r.unit ?? null,
    notes: r.notes ?? null,
  }));
  const { error } = await sb.from("customisation_addons").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${rows.length} customisation addons`);
  console.log("  Categories: figurine · topper · decor · finish · shape · technique · dietary");
  console.log("\nRe-runnable — only seeded rows are touched. Manage via /admin/addons.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

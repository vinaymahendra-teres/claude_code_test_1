/**
 * Seed product_lines with the brand-supported lines for Tiered Cake Company.
 *
 *   npm run seed:product-lines
 *
 * Idempotent (upserts on a deterministic id).
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

type Size = { name: string; servings: number; price_hint: number; notes?: string };
type Row = {
  id: string;
  name: string;
  label: string;
  description: string;
  default_unit: string;
  sizes: Size[];
  sort_order: number;
};

const LINES: Row[] = [
  {
    id: "pl-cake",
    name: "cake",
    label: "Cake",
    description: "Custom celebration cakes — round / square / shaped",
    default_unit: "cake",
    sort_order: 10,
    sizes: [
      { name: "Bento", servings: 2, price_hint: 1200, notes: "Solo / couple" },
      { name: "4 inch", servings: 6, price_hint: 1800 },
      { name: "6 inch", servings: 12, price_hint: 3500 },
      { name: "7 inch", servings: 16, price_hint: 4500 },
      { name: "8 inch", servings: 22, price_hint: 5500 },
      { name: "9 inch", servings: 32, price_hint: 7800 },
      { name: "10 inch", servings: 40, price_hint: 9500 },
      { name: "Two-tier", servings: 38, price_hint: 12000, notes: "6+8 or 6+9" },
    ],
  },
  {
    id: "pl-cupcake",
    name: "cupcake",
    label: "Cupcake box",
    description: "Hand-piped cupcakes, sold in boxes",
    default_unit: "box",
    sort_order: 20,
    sizes: [
      { name: "Box of 6", servings: 6, price_hint: 600 },
      { name: "Box of 12", servings: 12, price_hint: 1100 },
      { name: "Box of 24", servings: 24, price_hint: 2000 },
    ],
  },
  {
    id: "pl-brownie",
    name: "brownie",
    label: "Brownie tray",
    description: "Fudgy chocolate brownies, sliced and boxed",
    default_unit: "tray",
    sort_order: 30,
    sizes: [
      { name: "9 pieces", servings: 9, price_hint: 600 },
      { name: "16 pieces", servings: 16, price_hint: 1000 },
      { name: "Full tray (25)", servings: 25, price_hint: 1500 },
    ],
  },
  {
    id: "pl-tub",
    name: "tub",
    label: "Cake tub",
    description: "Layered cake in a ready-to-eat tub with spoon",
    default_unit: "tub",
    sort_order: 40,
    sizes: [
      { name: "250 ml", servings: 1, price_hint: 250 },
      { name: "500 ml", servings: 2, price_hint: 450 },
    ],
  },
  {
    id: "pl-bomboloni",
    name: "bomboloni",
    label: "Bomboloni",
    description: "Italian filled donuts, sold by the half-dozen",
    default_unit: "box",
    sort_order: 50,
    sizes: [
      { name: "Box of 6", servings: 6, price_hint: 480 },
      { name: "Box of 12", servings: 12, price_hint: 900 },
    ],
  },
];

async function main() {
  const rows = LINES.map((l) => ({ ...l, is_active: true }));
  const { error } = await sb.from("product_lines").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${rows.length} product lines:`);
  for (const l of LINES) {
    console.log(`  · ${l.label} (${l.sizes.length} sizes)`);
  }
  console.log("\nManage via /admin/product-lines.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
